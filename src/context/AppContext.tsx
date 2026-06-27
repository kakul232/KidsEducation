import React, { createContext, useContext, useState, useEffect } from "react";
import LocalDB from "../services/db";
import type { Student, Game, ActivityLog } from "../services/db";
import { auth as firebaseAuth } from "../services/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

export type ViewState = "onboarding" | "dashboard" | "game_player" | "admin_auth" | "admin_dashboard";

export interface AccessibilityConfig {
  fontSize: "normal" | "large" | "xlarge";
  useDyslexicFont: boolean;
  highContrast: boolean;
  voiceAssistance: boolean;
}

interface AppContextType {
  currentView: ViewState;
  currentStudent: Student | null;
  currentPlayingGame: Game | null;
  isAdminLoggedIn: boolean;
  accessibility: AccessibilityConfig;
  geminiApiKey: string;
  speakText: (text: string) => void;
  setView: (view: ViewState) => void;
  setOnboarding: (name: string, avatar: string) => void;
  setPlayingGame: (game: Game | null) => void;
  updateAccessibility: (config: Partial<AccessibilityConfig>) => void;
  saveApiKey: (key: string) => void;
  addStars: (count: number) => void;
  logOutAdmin: () => Promise<void>;
  logInAdmin: (email?: string, password?: string) => Promise<boolean>;
  recordActivity: (log: Omit<ActivityLog, "id" | "studentId" | "studentName" | "gameId" | "gameTitle" | "device" | "browser">) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewState>("onboarding");
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentPlayingGame, setCurrentPlayingGame] = useState<Game | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  
  const [accessibility, setAccessibility] = useState<AccessibilityConfig>({
    fontSize: "normal",
    useDyslexicFont: false,
    highContrast: false,
    voiceAssistance: true
  });

  // Initialize DB and load active student if exists
  useEffect(() => {
    const initializeAppDatabase = async () => {
      await LocalDB.init();
      
      // Load student from localStorage if exists
      const activeStudentId = localStorage.getItem("active_student_id");
      if (activeStudentId) {
        const student = await LocalDB.getStudent(activeStudentId);
        if (student) {
          setCurrentStudent(student);
          setCurrentView("dashboard");
        }
      }
    };
    initializeAppDatabase();

    // Load API Key
    const savedKey = localStorage.getItem("gemini_api_key") || "";
    setGeminiApiKey(savedKey);

    // Load accessibility settings
    const savedAccessibility = localStorage.getItem("accessibility_settings");
    if (savedAccessibility) {
      try {
        setAccessibility(JSON.parse(savedAccessibility as string));
      } catch (e) {
        console.error("Failed to load accessibility settings");
      }
    }
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
      } else {
        setIsAdminLoggedIn(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Sync accessibility classes to document body
  useEffect(() => {
    const classes = document.body.classList;
    
    // Reset font classes
    classes.remove("font-dyslexic", "font-size-large", "font-size-xlarge", "high-contrast");
    
    if (accessibility.useDyslexicFont) classes.add("font-dyslexic");
    if (accessibility.fontSize === "large") classes.add("font-size-large");
    if (accessibility.fontSize === "xlarge") classes.add("font-size-xlarge");
    if (accessibility.highContrast) classes.add("high-contrast");

    localStorage.setItem("accessibility_settings", JSON.stringify(accessibility));
  }, [accessibility]);

  // Voice Speech Utility
  const speakText = (text: string) => {
    if (!accessibility.voiceAssistance) return;
    
    // Stop any speech that is currently playing
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for children/dyslexia accessibility
    window.speechSynthesis.speak(utterance);
  };

  const setView = (view: ViewState) => {
    setCurrentView(view);
    // If navigating, read header details to aid dyslexic kids
    if (view === "dashboard" && currentStudent) {
      speakText(`Welcome back, ${currentStudent.name}! Ready to play?`);
    }
  };

  const setOnboarding = (name: string, avatar: string) => {
    const newStudent: Student = {
      id: "std_" + Math.random().toString(36).substr(2, 9),
      name,
      avatar,
      stars: 0,
      streak: 1,
      lastActive: new Date().toISOString()
    };
    
    LocalDB.saveStudent(newStudent);
    localStorage.setItem("active_student_id", newStudent.id);
    setCurrentStudent(newStudent);
    setCurrentView("dashboard");
    speakText(`Great job, ${name}! Let's start learning together.`);
  };

  const updateAccessibility = (config: Partial<AccessibilityConfig>) => {
    setAccessibility(prev => ({ ...prev, ...config }));
  };

  const saveApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem("gemini_api_key", key);
  };

  const addStars = (count: number) => {
    if (!currentStudent) return;
    const updated = {
      ...currentStudent,
      stars: currentStudent.stars + count,
      lastActive: new Date().toISOString()
    };
    LocalDB.saveStudent(updated);
    setCurrentStudent(updated);
  };

  const logInAdmin = async (emailInput?: string, passwordInput?: string) => {
    if (!emailInput || !passwordInput) return false;
    try {
      await signInWithEmailAndPassword(firebaseAuth, emailInput, passwordInput);
      setIsAdminLoggedIn(true);
      setCurrentView("admin_dashboard");
      return true;
    } catch (e: any) {
      console.error("Firebase Auth sign-in failed:", e.message);
      throw e;
    }
  };

  const logOutAdmin = async () => {
    try {
      await signOut(firebaseAuth);
      setIsAdminLoggedIn(false);
      setCurrentView("onboarding");
    } catch (e) {
      console.error("Firebase Auth sign-out failed", e);
    }
  };

  const setPlayingGame = (game: Game | null) => {
    setCurrentPlayingGame(game);
    if (game) {
      setCurrentView("game_player");
      // Read game title out loud
      speakText(`Playing ${game.title}. Let's have fun!`);
    } else {
      setCurrentView("dashboard");
    }
  };

  const recordActivity = (logDetails: Omit<ActivityLog, "id" | "studentId" | "studentName" | "gameId" | "gameTitle" | "device" | "browser">) => {
    if (!currentStudent || !currentPlayingGame) return;

    // Detect browser/device
    const userAgent = navigator.userAgent;
    let browser = "Unknown Browser";
    if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
    else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
    else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";

    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const device = isMobile ? "Mobile Device" : "Computer/Tablet";

    const log: ActivityLog = {
      id: "log_" + Math.random().toString(36).substr(2, 9),
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      gameId: currentPlayingGame.id,
      gameTitle: currentPlayingGame.title,
      device,
      browser,
      ...logDetails
    };

    LocalDB.saveLog(log);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        currentStudent,
        currentPlayingGame,
        isAdminLoggedIn,
        accessibility,
        geminiApiKey,
        speakText,
        setView,
        setOnboarding,
        setPlayingGame,
        updateAccessibility,
        saveApiKey,
        addStars,
        logOutAdmin,
        logInAdmin,
        recordActivity
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
