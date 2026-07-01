import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, Student, GameRequest } from "../../services/db";
import { generateGame } from "../../services/gemini";
import type { GeneratedGameResponse } from "../../services/gemini";
import Sandbox from "../../components/Sandbox";
import KidsLoader from "../../components/KidsLoader";
import { PatternLock } from "../../components/PatternLock";
import {
  BarChart3,
  Cpu,
  BookOpen,
  History,
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Lock,
  Unlock,
  Lightbulb,
  Edit2,
  Eye,
  EyeOff
} from "lucide-react";

const THEME_PRESETS = {
  space: {
    name: "Space Voyage 🌌",
    prompt: "Use space travel theme, include colorful floating planets, count visual stars, astronaut guidance."
  },
  ocean: {
    name: "Deep Sea 🐠",
    prompt: "Deep sea background with colorful fish swimming, pop oxygen bubbles to count, submarine guidance."
  },
  dino: {
    name: "Dino World 🦖",
    prompt: "Dinosaur footprints and jungle theme, match correct counts to feed food to a happy baby T-Rex."
  },
  candy: {
    name: "Candy Land 🍬",
    prompt: "Delicious sweet candies and cupcakes theme, stack sweets or pop candy drops to answer math challenges."
  },
  custom: {
    name: "Custom Theme 🪄",
    prompt: ""
  }
};

export const AdminDashboard: React.FC = () => {
  const {
    isAdminLoggedIn,
    logInAdmin,
    logOutAdmin,
    geminiApiKey,
    saveApiKey,
    setView,
    sendPushNotification
  } = useApp();

  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"stats" | "studio" | "games" | "analytics" | "requests" | "settings">("stats");

  // Database lists
  const [students, setStudents] = useState<Student[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [visibleLogCount, setVisibleLogCount] = useState(20);
  const [gameRequests, setGameRequests] = useState<GameRequest[]>([]);

  // AI Studio Generation Form States
  const [subject] = useState("Mathematics");
  const [topic, setTopic] = useState("Addition");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(["Grade 1"]);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [assignedStudentId, setAssignedStudentId] = useState("");
  const [gameInstruction, setGameInstruction] = useState("Use space travel theme, include colorful floating planets, count visual stars, astronaut guidance.");
  const [aiTheme, setAiTheme] = useState<"space" | "ocean" | "dino" | "candy" | "custom">("space");
  const [includeSound, setIncludeSound] = useState(true);
  const [dyslexiaTypography, setDyslexiaTypography] = useState(false);
  const [rounds, setRounds] = useState<number | "infinite">(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<GeneratedGameResponse | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [tweakInstruction, setTweakInstruction] = useState("");
  
  // Custom edit state for draft code
  const [draftCode, setDraftCode] = useState("");
  const [codeEditMode, setCodeEditMode] = useState(false);
  const [selectedDetailLog, setSelectedDetailLog] = useState<ActivityLog | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [groupByPhone, setGroupByPhone] = useState(false);
  const [patternModalStudent, setPatternModalStudent] = useState<Student | null>(null);

  // Settings
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [manualNotiTitle, setManualNotiTitle] = useState("");
  const [manualNotiMessage, setManualNotiMessage] = useState("");

  const handleSendManualNotification = async () => {
    if (!manualNotiTitle.trim() || !manualNotiMessage.trim()) {
      alert("Please fill in both the Alert Title and Alert Message!");
      return;
    }
    try {
      await sendPushNotification(manualNotiTitle.trim(), manualNotiMessage.trim());
      alert("Push notification broadcasted successfully! 🚀");
      setManualNotiTitle("");
      setManualNotiMessage("");
    } catch (err) {
      console.error("Failed to send manual notification broadcast:", err);
      alert("Failed to send manual notification broadcast.");
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      setIsAuthLoading(false);
      loadData();
    }
  }, [isAdminLoggedIn]);

  useEffect(() => {
    setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  // Infinite scroll paging triggers for analytics tab
  useEffect(() => {
    if (activeTab !== "analytics") return;

    const handleScroll = () => {
      // Check if user scrolled near the bottom of the window
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 120
      ) {
        setVisibleLogCount(prev => prev + 20);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "analytics") {
      setVisibleLogCount(20);
    }
  }, [activeTab]);

  const loadData = async () => {
    setIsDataLoading(true);
    // Pre-populate defaults under authenticated admin context
    await LocalDB.prepopulateDefaultGames();

    try {
      const [studentsList, gamesList, logsList, requestsList] = await Promise.all([
        LocalDB.getStudents(),
        LocalDB.getGames(),
        LocalDB.getLogs(),
        LocalDB.getGameRequests()
      ]);
      
      // Sort lists by updatedBy / Recent (newest first)
      const sortedStudents = [...studentsList].sort(
        (a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime()
      );
      const sortedGames = [...gamesList].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const sortedLogs = [...logsList].sort(
        (a, b) => new Date(b.finishTime || b.startTime || 0).getTime() - new Date(a.finishTime || a.startTime || 0).getTime()
      );
      const sortedRequests = [...requestsList].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setStudents(sortedStudents);
      setGames(sortedGames);
      setLogs(sortedLogs);
      setGameRequests(sortedRequests);
    } catch (e) {
      console.error("loadData failed in AdminDashboard:", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleExtendValidity = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const currentExp = student.validUntil ? new Date(student.validUntil) : new Date();
      const baseDate = currentExp > new Date() ? currentExp : new Date();
      const newExp = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const updatedStudent = {
        ...student,
        validUntil: newExp,
        lastActive: new Date().toISOString()
      };

      await LocalDB.saveStudent(updatedStudent);
      alert(`Extended validity for ${student.name} by +1 Month!\nNew Expiry: ${new Date(newExp).toLocaleDateString()}`);
      loadData();
    } catch (e) {
      console.error("Failed to extend validity:", e);
      alert("Error extending student validity.");
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSaveStudentPattern = async (pattern: string) => {
    if (!patternModalStudent) return;
    try {
      const updated = {
        ...patternModalStudent,
        patternLock: pattern
      };
      await LocalDB.saveStudent(updated);
      alert(`Successfully set Pattern Lock for ${patternModalStudent.name}!`);
      setPatternModalStudent(null);
      loadData();
    } catch (e) {
      console.error("Failed to set student pattern lock:", e);
      alert("Failed to set pattern lock.");
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    if (confirm(`Are you sure you want to delete the selected ${count} student(s)? This will permanently remove their profile data.`)) {
      try {
        await Promise.all(selectedStudentIds.map(id => LocalDB.deleteStudent(id)));
        alert(`Successfully deleted ${count} student(s)!`);
        setSelectedStudentIds([]);
        loadData();
      } catch (err: any) {
        console.error("Bulk deletion failed:", err);
        alert("Failed to delete selected students: " + err.message);
      }
    }
  };

  const handleBulkPremiumStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    try {
      await Promise.all(selectedStudentIds.map(async (id) => {
        const student = students.find(s => s.id === id);
        if (student) {
          const updated = {
            ...student,
            tier: "paid" as const
          };
          await LocalDB.saveStudent(updated);
        }
      }));
      alert(`Successfully upgraded ${count} student(s) to Premium! 💎`);
      setSelectedStudentIds([]);
      loadData();
    } catch (err: any) {
      console.error("Bulk premium update failed:", err);
      alert("Failed to update selected students tier: " + err.message);
    }
  };

  const handleBulkFreeStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    try {
      await Promise.all(selectedStudentIds.map(async (id) => {
        const student = students.find(s => s.id === id);
        if (student) {
          const updated = {
            ...student,
            tier: "free" as const
          };
          await LocalDB.saveStudent(updated);
        }
      }));
      alert(`Successfully changed ${count} student(s) to Free tier! 🆓`);
      setSelectedStudentIds([]);
      loadData();
    } catch (err: any) {
      console.error("Bulk free update failed:", err);
      alert("Failed to update selected students tier: " + err.message);
    }
  };

  const handleToggleStudentTier = async (student: Student) => {
    try {
      const updated = {
        ...student,
        tier: student.tier === "paid" ? "free" : ("paid" as any)
      };
      await LocalDB.saveStudent(updated);
      alert(`Updated ${student.name}'s tier to ${updated.tier === "paid" ? "💎 Premium" : "🆓 Free"}`);
      loadData();
    } catch (err: any) {
      console.error("Failed to toggle student tier:", err);
      alert("Error updating student tier.");
    }
  };

  const handleToggleGameTier = async (game: Game) => {
    try {
      const updated = {
        ...game,
        isFree: game.isFree === false ? true : false
      };
      await LocalDB.saveGame(updated);
      alert(`Updated game "${game.title}" to ${updated.isFree ? "🆓 Free" : "💎 Paid/Premium"}`);
      loadData();
    } catch (err: any) {
      console.error("Failed to toggle game tier:", err);
      alert("Error updating game tier.");
    }
  };

  const handleSaveGameOrder = async (gameId: string, orderVal: number) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      const updated = {
        ...game,
        order: isNaN(orderVal) ? 0 : orderVal
      };
      await LocalDB.saveGame(updated);
      loadData();
    } catch (err: any) {
      console.error("Failed to save game order:", err);
    }
  };

  const handleSaveGameStarsRequired = async (gameId: string, starsVal: number) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      const updated = {
        ...game,
        starsRequired: isNaN(starsVal) ? 0 : starsVal
      };
      await LocalDB.saveGame(updated);
      loadData();
    } catch (err: any) {
      console.error("Failed to save game star requirement:", err);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm("Are you sure you want to archive/delete this student request?")) {
      try {
        await LocalDB.deleteGameRequest(requestId);
        alert("Request archived successfully!");
        loadData();
      } catch (err: any) {
        console.error("Failed to archive request:", err);
        alert("Error archiving request.");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);
    try {
      await logInAdmin(email, password);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setAuthError("Invalid credentials. Please verify your email and password.");
      } else {
        setAuthError(err.message || "Authentication failed. Try again.");
      }
      setIsAuthLoading(false);
    }
  };

  const handleThemeChange = (themeKey: "space" | "ocean" | "dino" | "candy" | "custom") => {
    setAiTheme(themeKey);
    if (themeKey !== "custom") {
      setGameInstruction(THEME_PRESETS[themeKey].prompt);
    } else {
      setGameInstruction("");
    }
  };

  const handleAppendInstruction = (text: string) => {
    setGameInstruction(prev => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return text;
      if (cleanPrev.toLowerCase().includes(text.toLowerCase())) return prev;
      return cleanPrev + ", " + text;
    });
  };

  // AI Generator trigger
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedGame(null);
    setGenerationError("");
    setCodeEditMode(false);

    // Build the final combined AI instructions
    const combinedInstructions = [
      `Theme/Style: ${THEME_PRESETS[aiTheme].name}`,
      includeSound ? "Include visual audio feedback using HTML5 Web Audio API (AudioContext synth chimes) for correct and incorrect answers." : "Visual only feedback, do not write audio codes.",
      dyslexiaTypography ? "Strictly apply dyslexia-friendly typography adjustments: use larger rounded fonts (like Lexend/Outfit or Comic Neue), set letter-spacing to at least 0.12em, line-height to 1.6, bold font-weight, mixed-case text, and reversal prevention underlines." : "Do NOT apply specialized dyslexia-friendly typography styling. Use regular default web typography (standard modern sans-serif fonts, default letter-spacing, normal weight).",
      gameInstruction.trim()
    ].filter(Boolean).join("\n• ");

    try {
      const result = await generateGame(subject, topic, selectedClasses.join(", "), difficulty, geminiApiKey, combinedInstructions, rounds, undefined, dyslexiaTypography);
      setGeneratedGame(result);
      setDraftCode(result.htmlContent);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI generation failed. Verify API key and network.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!generatedGame) return;
    setGeneratedGame({
      ...generatedGame,
      title: newTitle
    });
  };

  const handleClearHtml = () => {
    setDraftCode("");
  };

  const handleRegenerate = async () => {
    if (!tweakInstruction.trim() || !draftCode.trim()) return;
    setIsGenerating(true);
    setGenerationError("");

    const modifyInstructions = [
      `Theme/Style: ${THEME_PRESETS[aiTheme].name}`,
      includeSound ? "Include visual audio feedback using HTML5 Web Audio API (AudioContext synth chimes) for correct and incorrect answers." : "Visual only feedback, do not write audio codes.",
      dyslexiaTypography ? "Strictly apply dyslexia-friendly typography adjustments: use larger rounded fonts (like Lexend/Outfit or Comic Neue), set letter-spacing to at least 0.12em, line-height to 1.6, bold font-weight, mixed-case text, and reversal prevention underlines." : "Do NOT apply specialized dyslexia-friendly typography styling. Use regular default web typography (standard modern sans-serif fonts, default letter-spacing, normal weight).",
      gameInstruction.trim() ? `Base instructions: ${gameInstruction.trim()}` : "",
      `REGENERATION REQUEST: Modify the existing HTML code according to this custom request: "${tweakInstruction.trim()}". Keep the rest of the game structures, logic, and sounds unchanged.`
    ].filter(Boolean).join("\n• ");

    try {
      const result = await generateGame(subject, topic, selectedClasses.join(", "), difficulty, geminiApiKey, modifyInstructions, rounds, draftCode, dyslexiaTypography);
      setGeneratedGame(result);
      setDraftCode(result.htmlContent);
      setTweakInstruction("");
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI regeneration failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedGame) return;

    const newGame: Game = {
      id: editingGameId || ("game_" + Math.random().toString(36).substr(2, 9)),
      title: generatedGame.title,
      topic: generatedGame.topic,
      subject: "Mathematics",
      class: generatedGame.class || selectedClasses.join(", "),
      difficulty: generatedGame.difficulty as any,
      htmlContent: draftCode, // Save current draft code (which includes any admin edits!)
      published: true,
      createdAt: new Date().toISOString(),
      assignedStudentId: assignedStudentId || ""
    };

    try {
      await LocalDB.saveGame(newGame);
      await loadData();

      // Automatically broadcast notification to students
      try {
        await sendPushNotification(
          "New Game Published! 🎮",
          `A new math activity "${newGame.title}" is ready! Let's play and earn stars! ✨`
        );
      } catch (notiErr) {
        console.warn("Could not trigger publish notification:", notiErr);
      }

      alert(editingGameId ? "Game successfully updated! ✏️" : "Game successfully published to students! 🎉");
      setGeneratedGame(null);
      setEditingGameId(null);
      setActiveTab("games");
    } catch (err: any) {
      console.error("Publish failed:", err);
      alert("Failed to publish game: " + (err.message || "Unknown database error."));
    }
  };

  const handleSaveAsDraft = async () => {
    if (!generatedGame) return;

    const newGame: Game = {
      id: editingGameId || ("game_" + Math.random().toString(36).substr(2, 9)),
      title: generatedGame.title,
      topic: generatedGame.topic,
      subject: "Mathematics",
      class: generatedGame.class || selectedClasses.join(", "),
      difficulty: generatedGame.difficulty as any,
      htmlContent: draftCode,
      published: false, // Save as Draft
      createdAt: new Date().toISOString(),
      assignedStudentId: assignedStudentId || ""
    };

    try {
      await LocalDB.saveGame(newGame);
      await loadData();
      alert(editingGameId ? "Draft successfully updated! ✏️" : "Game successfully saved as Draft! 📁");
      setGeneratedGame(null);
      setEditingGameId(null);
      setActiveTab("games");
    } catch (err: any) {
      console.error("Save as Draft failed:", err);
      alert("Failed to save draft: " + (err.message || "Unknown database error."));
    }
  };

  const handleEditGame = (game: Game) => {
    setTopic(game.topic);
    if (game.class) {
      setSelectedClasses(game.class.split(",").map(c => c.trim()));
    } else {
      setSelectedClasses(["Grade 1"]);
    }
    setDifficulty(game.difficulty);
    setAssignedStudentId(game.assignedStudentId || "");
    setDraftCode(game.htmlContent);
    setGeneratedGame({
      title: game.title,
      topic: game.topic,
      class: game.class || "Grade 1",
      difficulty: game.difficulty,
      htmlContent: game.htmlContent,
      promptUsed: "",
      isValid: true,
      errors: []
    });
    setEditingGameId(game.id);
    setCodeEditMode(true);
    setGenerationError("");
    setActiveTab("studio");
  };

  const handleCancelEdit = () => {
    setEditingGameId(null);
    setGeneratedGame(null);
    setDraftCode("");
    setCodeEditMode(false);
    setTopic("Addition");
    setSelectedClasses(["Grade 1"]);
    setDifficulty("Easy");
    setAssignedStudentId("");
    setGameInstruction("");
  };

  const handleTogglePublish = async (game: Game) => {
    const updated = {
      ...game,
      published: !game.published
    };
    try {
      await LocalDB.saveGame(updated);
      await loadData();

      if (updated.published) {
        try {
          await sendPushNotification(
            "New Game Published! 🎮",
            `A new math activity "${updated.title}" is ready! Let's play and earn stars! ✨`
          );
        } catch (notiErr) {
          console.warn("Could not trigger toggle publish notification:", notiErr);
        }
      }
    } catch (e: any) {
      alert("Failed to toggle publish status: " + e.message);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (confirm("Are you sure you want to delete this game?")) {
      await LocalDB.deleteGame(id);
      await loadData();
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey(apiKeyInput);
    alert("Settings saved successfully!");
  };

  // Render Login view if not logged in
  if (!isAdminLoggedIn) {
    return (
      <div className="container animate-slide-up" style={{ justifyContent: "center" }}>
        {isAuthLoading && <KidsLoader />}
        <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "var(--accent-primary)",
                color: "#fff",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px"
              }}
            >
              <Lock size={30} />
            </div>
            <h2 style={{ fontSize: "1.5rem" }}>Admin Portal Login</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Secure authentication for educators & administrators
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="admin-email-field" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Email Address</label>
              <input
                id="admin-email-field"
                type="email"
                placeholder="teacher@school.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  padding: "14px",
                  fontSize: "1rem",
                  borderRadius: "12px",
                  border: "2px solid #cbd5e1"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="admin-pass-field" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Password</label>
              <input
                id="admin-pass-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  padding: "14px",
                  fontSize: "1rem",
                  borderRadius: "12px",
                  border: "2px solid #cbd5e1"
                }}
              />
            </div>

            {authError && (
              <span style={{ color: "var(--accent-primary)", fontWeight: "600", fontSize: "0.95rem" }}>
                {authError}
              </span>
            )}

            <button type="submit" className="btn btn-primary" style={{ padding: "16px" }}>
              Log In to Portal
            </button>
          </form>

          <button
            onClick={() => setView("onboarding")}
            className="btn btn-gray"
            style={{ padding: "10px", fontSize: "0.9rem", boxShadow: "none" }}
          >
            Back to Student Screen
          </button>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard layout
  return (
    <div className="admin-container animate-slide-up">
      {(isGenerating || isDataLoading) && <KidsLoader />}
      
      {/* Admin Header */}
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.4rem", color: "var(--text-primary)" }}>🏫 Educator Dashboard</h1>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>School Management & AI Studio</span>
        </div>
        <div className="admin-header-actions">
          <button
            onClick={() => setView("onboarding")}
            className="btn btn-gray"
            style={{ padding: "10px 16px", fontSize: "0.85rem", boxShadow: "none" }}
          >
            Play Mode
          </button>
          <button
            onClick={logOutAdmin}
            className="btn btn-primary"
            style={{ padding: "10px 16px", fontSize: "0.85rem", boxShadow: "none" }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "8px"
        }}
      >
        {[
          { id: "stats", label: "Overview", icon: <BarChart3 size={18} /> },
          { id: "studio", label: "AI Studio", icon: <Cpu size={18} /> },
          { id: "games", label: "All Games", icon: <BookOpen size={18} /> },
          { id: "requests", label: "Student Ideas", icon: <Lightbulb size={18} /> },
          { id: "analytics", label: "Analytics", icon: <History size={18} /> },
          { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="btn"
            style={{
              padding: "12px 18px",
              fontSize: "0.9rem",
              boxShadow: "none",
              backgroundColor: activeTab === tab.id ? "var(--accent-primary)" : "#fff",
              color: activeTab === tab.id ? "#fff" : "var(--text-primary)",
              border: "2px solid #e2e8f0",
              flexShrink: 0
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* TAB 1: OVERVIEW STATS */}
        {activeTab === "stats" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="admin-stats-grid">
              <div className="play-card" style={{ textAlign: "center" }}>
                <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-primary)" }}>
                  {students.length}
                </span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Registered Students
                </p>
              </div>
              <div className="play-card" style={{ textAlign: "center" }}>
                <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-secondary)" }}>
                  {games.length}
                </span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Total Game Activities
                </p>
              </div>
              <div className="play-card" style={{ textAlign: "center" }}>
                <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--success)" }}>
                  {logs.length}
                </span>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Plays Completed
                </p>
              </div>
            </div>

            {/* Students List */}
            <div className="play-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Active Students ({students.length})</h3>
                  <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                    <button
                      onClick={() => setGroupByPhone(false)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: !groupByPhone ? "#fff" : "transparent",
                        color: !groupByPhone ? "var(--text-primary)" : "var(--text-secondary)",
                        boxShadow: !groupByPhone ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      📋 Flat List
                    </button>
                    <button
                      onClick={() => setGroupByPhone(true)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: groupByPhone ? "#fff" : "transparent",
                        color: groupByPhone ? "var(--text-primary)" : "var(--text-secondary)",
                        boxShadow: groupByPhone ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      📞 Group by Phone
                    </button>
                  </div>
                </div>
                {selectedStudentIds.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={handleBulkPremiumStudents}
                      className="btn btn-success"
                      style={{
                        padding: "8px 14px",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        borderRadius: "10px",
                        boxShadow: "none",
                        cursor: "pointer"
                      }}
                    >
                      💎 Make Premium ({selectedStudentIds.length})
                    </button>
                    <button
                      onClick={handleBulkFreeStudents}
                      className="btn"
                      style={{
                        padding: "8px 14px",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        borderRadius: "10px",
                        boxShadow: "none",
                        backgroundColor: "#f1f5f9",
                        border: "1.5px solid #cbd5e1",
                        color: "#475569",
                        cursor: "pointer"
                      }}
                    >
                      🆓 Make Free ({selectedStudentIds.length})
                    </button>
                    <button
                      onClick={handleBulkDeleteStudents}
                      className="btn"
                      style={{
                        padding: "8px 14px",
                        backgroundColor: "#fee2e2",
                        border: "1.5px solid #ef4444",
                        color: "#b91c1c",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        boxShadow: "none",
                        cursor: "pointer"
                      }}
                    >
                      🗑️ Delete ({selectedStudentIds.length})
                    </button>
                  </div>
                )}
              </div>
              {students.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>No students registered yet.</p>
              ) : groupByPhone ? (
                (() => {
                  const groups: { [phone: string]: Student[] } = {};
                  students.forEach(std => {
                    const rawPhone = std.phone?.trim();
                    const phoneKey = rawPhone || "No Phone Number";
                    if (!groups[phoneKey]) {
                      groups[phoneKey] = [];
                    }
                    groups[phoneKey].push(std);
                  });

                  const sortedPhoneKeys = Object.keys(groups).sort((a, b) => {
                    if (a === "No Phone Number") return 1;
                    if (b === "No Phone Number") return -1;
                    return a.localeCompare(b);
                  });

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {sortedPhoneKeys.map(phoneKey => {
                        const groupStudents = groups[phoneKey];
                        const isGroupAllSelected = groupStudents.every(s => selectedStudentIds.includes(s.id));
                        const handleToggleGroup = () => {
                          if (isGroupAllSelected) {
                            const idsToRemove = groupStudents.map(s => s.id);
                            setSelectedStudentIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                          } else {
                            const idsToAdd = groupStudents.map(s => s.id).filter(id => !selectedStudentIds.includes(id));
                            setSelectedStudentIds(prev => [...prev, ...idsToAdd]);
                          }
                        };

                        return (
                          <div
                            key={phoneKey}
                            style={{
                              backgroundColor: "#f8fafc",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "16px",
                              padding: "16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "12px"
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "1.5px solid #cbd5e1",
                                paddingBottom: "10px",
                                marginBottom: "4px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <input
                                  type="checkbox"
                                  checked={isGroupAllSelected}
                                  onChange={handleToggleGroup}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    accentColor: "var(--accent-primary)",
                                    cursor: "pointer"
                                  }}
                                />
                                <span style={{ fontWeight: "800", fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                  {phoneKey === "No Phone Number" ? "❔" : "📞"} {phoneKey}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  backgroundColor: "var(--accent-primary)",
                                  color: "#fff",
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  fontWeight: "800"
                                }}
                              >
                                {groupStudents.length} {groupStudents.length === 1 ? "Student" : "Students"}
                              </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {groupStudents.map(std => {
                                const isExpired = std.validUntil && new Date() > new Date(std.validUntil);
                                return (
                                  <div
                                    key={std.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      padding: "12px 16px",
                                      backgroundColor: "#fff",
                                      borderRadius: "12px",
                                      border: "1.5px solid",
                                      borderColor: selectedStudentIds.includes(std.id) ? "var(--accent-primary)" : "#cbd5e1"
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedStudentIds.includes(std.id)}
                                        onChange={() => handleToggleSelectStudent(std.id)}
                                        style={{
                                          width: "18px",
                                          height: "18px",
                                          borderRadius: "4px",
                                          accentColor: "var(--accent-primary)",
                                          cursor: "pointer"
                                        }}
                                      />
                                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                                          <span style={{ fontWeight: "700", fontSize: "1rem" }}>{std.name}</span>
                                          <span
                                            style={{
                                              fontSize: "0.75rem",
                                              backgroundColor: std.tier === "paid" ? "#fee2e2" : "#f1f5f9",
                                              color: std.tier === "paid" ? "#991b1b" : "#475569",
                                              padding: "2px 8px",
                                              borderRadius: "6px",
                                              fontWeight: "800"
                                            }}
                                          >
                                            {std.tier === "paid" ? "💎 Premium" : "🆓 Free"}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                          Age: {std.age || "N/A"} | Class: {std.class || "N/A"} | Pattern: {std.patternLock ? "🔒 Set" : "🔓 Not Set"}
                                        </span>
                                        <span style={{ fontSize: "0.8rem", color: isExpired ? "#ef4444" : "#10b981", fontWeight: "800" }}>
                                          {isExpired ? "⏰ Expired" : "✓ Active"} (Expires: {std.validUntil ? new Date(std.validUntil).toLocaleDateString() : "Never"})
                                        </span>
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                      <span style={{ color: "#c2410c", fontWeight: "800", fontSize: "0.95rem" }}>⭐ {std.stars} Stars</span>
                                      <button
                                        onClick={() => handleToggleStudentTier(std)}
                                        className="btn"
                                        style={{
                                          padding: "6px 10px",
                                          fontSize: "0.75rem",
                                          boxShadow: "none",
                                          backgroundColor: std.tier === "paid" ? "#f1f5f9" : "#fee2e2",
                                          border: std.tier === "paid" ? "1.5px solid #cbd5e1" : "1.5px solid #ef4444",
                                          color: std.tier === "paid" ? "#475569" : "#b91c1c",
                                          fontWeight: "800",
                                          cursor: "pointer"
                                        }}
                                      >
                                        {std.tier === "paid" ? "🆓 Make Free" : "💎 Make Premium"}
                                      </button>
                                      <button
                                        onClick={() => setPatternModalStudent(std)}
                                        className="btn"
                                        style={{
                                          padding: "6px 10px",
                                          fontSize: "0.75rem",
                                          boxShadow: "none",
                                          backgroundColor: "#e0f2fe",
                                          border: "1.5px solid #0284c7",
                                          color: "#0369a1",
                                          fontWeight: "800",
                                          cursor: "pointer"
                                        }}
                                      >
                                        🔑 Pattern
                                      </button>
                                      <button
                                        onClick={() => handleExtendValidity(std.id)}
                                        className="btn btn-success"
                                        style={{
                                          padding: "6px 12px",
                                          fontSize: "0.75rem",
                                          boxShadow: "none",
                                          backgroundColor: "#d1fae5",
                                          border: "1.5px solid #10b981",
                                          color: "#065f46"
                                        }}
                                      >
                                        ➕ Renew +1 Mo
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {students.map(std => {
                    const isExpired = std.validUntil && new Date() > new Date(std.validUntil);
                    return (
                      <div
                        key={std.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          backgroundColor: "var(--bg-primary)",
                          borderRadius: "12px",
                          border: "1.5px solid",
                          borderColor: selectedStudentIds.includes(std.id) ? "var(--accent-primary)" : "#cbd5e1"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(std.id)}
                            onChange={() => handleToggleSelectStudent(std.id)}
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              accentColor: "var(--accent-primary)",
                              cursor: "pointer"
                            }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                              <span style={{ fontWeight: "700", fontSize: "1rem" }}>{std.name}</span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  backgroundColor: std.tier === "paid" ? "#fee2e2" : "#f1f5f9",
                                  color: std.tier === "paid" ? "#991b1b" : "#475569",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontWeight: "800"
                                }}
                              >
                                {std.tier === "paid" ? "💎 Premium" : "🆓 Free"}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              Age: {std.age || "N/A"} | Class: {std.class || "N/A"} | Phone: {std.phone || "N/A"} | Pattern: {std.patternLock ? "🔒 Set" : "🔓 Not Set"}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: isExpired ? "#ef4444" : "#10b981", fontWeight: "800" }}>
                              {isExpired ? "⏰ Expired" : "✓ Active"} (Expires: {std.validUntil ? new Date(std.validUntil).toLocaleDateString() : "Never"})
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ color: "#c2410c", fontWeight: "800", fontSize: "0.95rem" }}>⭐ {std.stars} Stars</span>
                          <button
                            onClick={() => handleToggleStudentTier(std)}
                            className="btn"
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.75rem",
                              boxShadow: "none",
                              backgroundColor: std.tier === "paid" ? "#f1f5f9" : "#fee2e2",
                              border: std.tier === "paid" ? "1.5px solid #cbd5e1" : "1.5px solid #ef4444",
                              color: std.tier === "paid" ? "#475569" : "#b91c1c",
                              fontWeight: "800",
                              cursor: "pointer"
                            }}
                          >
                            {std.tier === "paid" ? "🆓 Make Free" : "💎 Make Premium"}
                          </button>
                          <button
                            onClick={() => setPatternModalStudent(std)}
                            className="btn"
                            style={{
                              padding: "6px 10px",
                              fontSize: "0.75rem",
                              boxShadow: "none",
                              backgroundColor: "#e0f2fe",
                              border: "1.5px solid #0284c7",
                              color: "#0369a1",
                              fontWeight: "800",
                              cursor: "pointer"
                            }}
                          >
                            🔑 Pattern
                          </button>
                          <button
                            onClick={() => handleExtendValidity(std.id)}
                            className="btn btn-success"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.75rem",
                              boxShadow: "none",
                              backgroundColor: "#d1fae5",
                              border: "1.5px solid #10b981",
                              color: "#065f46"
                            }}
                          >
                            ➕ Renew +1 Mo
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI STUDIO (GAME GENERATION) */}
        {activeTab === "studio" && (
          <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Sparkling AI Header Banner */}
            <div className="ai-studio-header">
              <div>
                <h3 style={{ fontSize: "1.3rem", color: "#fff", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                  🪄 Gemini AI Studio
                </h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.9)", marginTop: "6px", marginBottom: "0px" }}>
                  {editingGameId 
                    ? "Modify and re-generate existing game details." 
                    : (geminiApiKey && geminiApiKey.trim().length > 0
                        ? "Co-create visual, dyslexia-accessible arithmetic activities using Gemini AI." 
                        : "No API key saved. Creating a game will compile a simulated Balloon Counting template activity.")
                  }
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    marginTop: "10px",
                    backgroundColor: (geminiApiKey && geminiApiKey.trim().length > 0) ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)",
                    color: (geminiApiKey && geminiApiKey.trim().length > 0) ? "#34d399" : "#fbbf24",
                    border: "1px solid",
                    borderColor: (geminiApiKey && geminiApiKey.trim().length > 0) ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: (geminiApiKey && geminiApiKey.trim().length > 0) ? "#10b981" : "#fbbf24",
                      display: "inline-block"
                    }}
                  />
                  {(geminiApiKey && geminiApiKey.trim().length > 0) ? "Gemini Connected (Live Mode)" : "Using Mock Mode (No API Key)"}
                </div>
              </div>
              {editingGameId && (
                <button
                  onClick={handleCancelEdit}
                  className="btn"
                  style={{
                    padding: "8px 14px",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    border: "1.5px solid rgba(255, 255, 255, 0.4)",
                    color: "#fff",
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    boxShadow: "none"
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* AI Setup options Grid */}
            <div className="admin-form-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="student-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Select Student</label>
                <select
                  id="student-selector-studio"
                  value={assignedStudentId}
                  onChange={e => setAssignedStudentId(e.target.value)}
                  style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
                >
                  <option value="">All Students (General Publish)</option>
                  {students.map(std => (
                    <option key={std.id} value={std.id}>
                      {std.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="topic-input-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Select Topic</label>
                <input
                  id="topic-input-studio"
                  type="text"
                  placeholder="e.g. Addition, Subtraction, Counting"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                 <label style={{ fontWeight: "700", fontSize: "0.9rem" }}>Target Classes / Grades</label>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px", backgroundColor: "#fff", padding: "10px", borderRadius: "10px", border: "2px solid #cbd5e1" }}>
                   {["Preschool", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7"].map(cls => (
                     <label key={cls} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>
                       <input
                         type="checkbox"
                         checked={selectedClasses.includes(cls)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setSelectedClasses(prev => [...prev, cls]);
                           } else {
                             setSelectedClasses(prev => prev.filter(c => c !== cls));
                           }
                         }}
                         style={{ width: "16px", height: "16px" }}
                       />
                       {cls}
                     </label>
                   ))}
                 </div>
               </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="difficulty-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Difficulty</label>
                <select
                  id="difficulty-selector-studio"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="rounds-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Rounds Limit</label>
                <select
                  id="rounds-selector-studio"
                  value={rounds}
                  onChange={e => setRounds(e.target.value === "infinite" ? "infinite" : Number(e.target.value))}
                  style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds</option>
                  <option value={4}>4 Rounds</option>
                  <option value={5}>5 Rounds (Recommended)</option>
                  <option value={6}>6 Rounds</option>
                  <option value={7}>7 Rounds</option>
                  <option value={8}>8 Rounds</option>
                  <option value={9}>9 Rounds</option>
                  <option value={10}>10 Rounds</option>
                  <option value="infinite">Infinite Rounds ♾️</option>
                </select>
              </div>
            </div>

            {/* AI Theme Presets Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>🎨 Select Game Creative Theme (AI Preset)</span>
              <div className="ai-theme-grid">
                {(Object.keys(THEME_PRESETS) as Array<keyof typeof THEME_PRESETS>).map((key) => {
                  const preset = THEME_PRESETS[key];
                  const emojis: Record<string, string> = { space: "🌌", ocean: "🐠", dino: "🦖", candy: "🍬", custom: "🪄" };
                  return (
                    <div
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className={`ai-theme-card ${aiTheme === key ? "active" : ""}`}
                    >
                      <span className="icon">{emojis[key]}</span>
                      <span className="title">{preset.name.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom AI Instructions Box */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="instruction-input-studio" style={{ fontWeight: "700", fontSize: "0.95rem" }}>
                📝 Custom AI Prompts & Directives
              </label>
              <textarea
                id="instruction-input-studio"
                rows={3}
                placeholder="Describe custom graphics, theme accents, or select quick suggestion pills below..."
                value={gameInstruction}
                onChange={e => setGameInstruction(e.target.value)}
                style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1", resize: "vertical" }}
              />
              
              {/* Quick Click Suggestion Pills */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>
                  💡 Click to add specific directives to the prompt:
                </span>
                <div className="ai-pills-container">
                  <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("large chunky buttons")}>
                    🔘 Chunky Buttons
                  </button>
                  <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("direct canvas touch gestures")}>
                    👈 Touch/Swipe Controls
                  </button>
                  <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("dyslexia-friendly high contrast colors")}>
                    👁️ Dyslexia Colors
                  </button>
                  <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("synthesizer chime sounds")}>
                    🔊 Audio Synthesis
                  </button>
                  <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("celebrative confetti animations")}>
                    🎉 Confetti FX
                  </button>
                  <button type="button" className="ai-pill" onClick={() => handleAppendInstruction("visual items instead of dots")}>
                    🎨 Visual Icons
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Feedback option */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", padding: "12px 18px", borderRadius: "16px", border: "1px solid #cbd5e1" }}>
              <input
                id="audio-toggle-studio"
                type="checkbox"
                checked={includeSound}
                onChange={e => setIncludeSound(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <label htmlFor="audio-toggle-studio" style={{ fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}>
                🔊 Prompt AI to write HTML5 Audio Synth Feedback (Plays sounds on answers)
              </label>
            </div>

            {/* Dyslexia-Friendly Typograph option */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#f8fafc", padding: "12px 18px", borderRadius: "16px", border: "1px solid #cbd5e1" }}>
              <input
                id="typography-toggle-studio"
                type="checkbox"
                checked={dyslexiaTypography}
                onChange={e => setDyslexiaTypography(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <label htmlFor="typography-toggle-studio" style={{ fontWeight: "700", fontSize: "0.9rem", cursor: "pointer" }}>
                🔤 Dyslexia-Friendly Typograph (Rounded fonts, increased spacing, reversal cues)
              </label>
            </div>

            {/* Prompt Preview */}
            <div style={{ padding: "14px", borderRadius: "16px", backgroundColor: "#f0fdfa", border: "1.5px solid #5eead4", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: "700", color: "#0f766e" }}>💡 Structured Guidelines Sent to AI model:</span>
              <div style={{ color: "#0f766e", lineHeight: "1.4", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                • Theme/Style: {THEME_PRESETS[aiTheme].name}
                {"\n"}• Rounds: {rounds === "infinite" ? "Infinite loop of tasks (Continuous Play)" : `${rounds} Round(s) Limit`}
                {"\n"}• {includeSound ? "Include HTML5 Web Audio synth feedback tone generator." : "Visual only feedback, do not write audio codes."}
                {"\n"}• Dyslexia Typography: {dyslexiaTypography ? "ENABLED (large spaced rounded fonts, reversal cues)" : "DISABLED (standard font stack)"}
                {gameInstruction.trim() && `\n• ${gameInstruction.trim()}`}
              </div>
            </div>

            {/* Action Trigger button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn btn-primary"
              style={{ width: "100%", padding: "16px" }}
            >
              {isGenerating ? "Gemini AI Generating Game..." : "Generate AI Game"}
            </button>

            {generationError && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  backgroundColor: "#fee2e2",
                  border: "2px solid #ef4444",
                  color: "#b91c1c",
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  lineHeight: "1.4"
                }}
              >
                <span>⚠️</span>
                <span>{generationError}</span>
              </div>
            )}

            {/* Generated Game Output & Sandbox */}
            {generatedGame && (
              <div
                style={{
                  marginTop: "20px",
                  borderTop: "2px solid #e2e8f0",
                  paddingTop: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "250px" }}>
                      <label htmlFor="game-title-editable" style={{ fontSize: "0.85rem", fontWeight: "700" }}>Game Name</label>
                      <input
                        id="game-title-editable"
                        type="text"
                        value={generatedGame.title}
                        onChange={e => handleTitleChange(e.target.value)}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "2px solid #cbd5e1",
                          fontSize: "1rem",
                          width: "100%",
                          backgroundColor: "#fff"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setCodeEditMode(!codeEditMode)}
                        className="btn btn-gray"
                        style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                      >
                        {codeEditMode ? "View Sandbox" : "Edit HTML Code"}
                      </button>
                      <button
                        onClick={handleSaveAsDraft}
                        disabled={!generatedGame.isValid || !generatedGame.title.trim()}
                        className="btn btn-gray"
                        style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none", backgroundColor: "#f1f5f9", border: "1.5px solid #cbd5e1", color: "#475569" }}
                      >
                        📁 Save as Draft
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={!generatedGame.isValid || !generatedGame.title.trim()}
                        className="btn btn-success"
                        style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                      >
                        {editingGameId ? "Save Changes" : "Publish Game"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Safety & Validation Report */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: generatedGame.isValid ? "#d1fae5" : "#fee2e2",
                    border: `1.5px solid ${generatedGame.isValid ? "#10b981" : "#ef4444"}`,
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start"
                  }}
                >
                  {generatedGame.isValid ? (
                    <>
                      <CheckCircle size={20} color="#047857" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: "700", color: "#065f46" }}>Game Code Validated!</span>
                        <p style={{ fontSize: "0.8rem", color: "#065f46", marginTop: "2px" }}>
                          No dangerous browser APIs or external scripts detected. Ready to deploy.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} color="#b91c1c" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: "700", color: "#7f1d1d" }}>Security Validation Warnings</span>
                        <ul style={{ fontSize: "0.8rem", color: "#7f1d1d", marginTop: "4px", paddingLeft: "16px" }}>
                          {generatedGame.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>

                {/* Edit Mode / Sandbox switch */}
                {codeEditMode ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label htmlFor="html-editor-textarea" style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                        HTML/CSS/JS Source Code
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            try {
                              const formatJS = (code: string, baseIndent: number): string => {
                                const lines = code.split('\n');
                                const formatted: string[] = [];
                                let indent = baseIndent;
                                
                                lines.forEach(line => {
                                  const trimmed = line.trim();
                                  if (!trimmed) return;
                                  
                                  // Decrease indent for closing braces/brackets
                                  if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
                                    indent = Math.max(baseIndent, indent - 1);
                                  }
                                  
                                  formatted.push('  '.repeat(indent) + trimmed);
                                  
                                  // Increase indent after opening braces/brackets
                                  if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
                                    indent++;
                                  }
                                  
                                  // Decrease indent after closing on same line
                                  if ((trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) &&
                                      (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('('))) {
                                    // Do nothing, already handled
                                  } else if (trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) {
                                    indent = Math.max(baseIndent, indent - 1);
                                  }
                                });
                                
                                return formatted.join('\n');
                              };
                              
                              const formatCSS = (code: string, baseIndent: number): string => {
                                const lines = code.split('\n');
                                const formatted: string[] = [];
                                let indent = baseIndent;
                                
                                lines.forEach(line => {
                                  const trimmed = line.trim();
                                  if (!trimmed) return;
                                  
                                  if (trimmed === '}') {
                                    indent = Math.max(baseIndent, indent - 1);
                                  }
                                  
                                  formatted.push('  '.repeat(indent) + trimmed);
                                  
                                  if (trimmed.endsWith('{')) {
                                    indent++;
                                  } else if (trimmed === '}') {
                                    // Already decreased above
                                  }
                                });
                                
                                return formatted.join('\n');
                              };
                              
                              // Main formatter
                              let result = '';
                              let htmlIndent = 0;
                              const parts = draftCode.split(/(<script[^>]*>|<\/script>|<style[^>]*>|<\/style>)/gi);
                              let inScript = false;
                              let inStyle = false;
                              let scriptContent = '';
                              let styleContent = '';
                              
                              parts.forEach(part => {
                                if (part.match(/<script[^>]*>/i)) {
                                  result += '  '.repeat(htmlIndent) + part + '\n';
                                  inScript = true;
                                  htmlIndent++;
                                  scriptContent = '';
                                } else if (part.match(/<\/script>/i)) {
                                  if (scriptContent.trim()) {
                                    result += formatJS(scriptContent, htmlIndent) + '\n';
                                  }
                                  htmlIndent = Math.max(0, htmlIndent - 1);
                                  result += '  '.repeat(htmlIndent) + part + '\n';
                                  inScript = false;
                                } else if (part.match(/<style[^>]*>/i)) {
                                  result += '  '.repeat(htmlIndent) + part + '\n';
                                  inStyle = true;
                                  htmlIndent++;
                                  styleContent = '';
                                } else if (part.match(/<\/style>/i)) {
                                  if (styleContent.trim()) {
                                    result += formatCSS(styleContent, htmlIndent) + '\n';
                                  }
                                  htmlIndent = Math.max(0, htmlIndent - 1);
                                  result += '  '.repeat(htmlIndent) + part + '\n';
                                  inStyle = false;
                                } else if (inScript) {
                                  scriptContent += part;
                                } else if (inStyle) {
                                  styleContent += part;
                                } else {
                                  // Format HTML
                                  const tags = part.split(/(<[^>]+>)/g).filter(s => s.trim());
                                  tags.forEach(tag => {
                                    if (tag.startsWith('</')) {
                                      htmlIndent = Math.max(0, htmlIndent - 1);
                                      result += '  '.repeat(htmlIndent) + tag + '\n';
                                    } else if (tag.startsWith('<') && !tag.endsWith('/>') &&
                                               !tag.match(/<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)/i)) {
                                      result += '  '.repeat(htmlIndent) + tag + '\n';
                                      htmlIndent++;
                                    } else if (tag.startsWith('<')) {
                                      result += '  '.repeat(htmlIndent) + tag + '\n';
                                    } else if (tag.trim()) {
                                      result += '  '.repeat(htmlIndent) + tag.trim() + '\n';
                                    }
                                  });
                                }
                              });
                              
                              setDraftCode(result.trim());
                            } catch (err) {
                              alert('Could not format document. Please check for syntax errors.');
                            }
                          }}
                          className="btn"
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "#dbeafe",
                            border: "1.5px solid #bfdbfe",
                            color: "#1e40af",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            boxShadow: "none"
                          }}
                        >
                          ✨ Format Document
                        </button>
                        <button
                          onClick={handleClearHtml}
                          className="btn"
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "#fee2e2",
                            border: "1.5px solid #fecaca",
                            color: "#b91c1c",
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            boxShadow: "none"
                          }}
                        >
                          🗑️ Clear All
                        </button>
                      </div>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "280px",
                      borderRadius: "10px",
                      border: "2px solid #cbd5e1",
                      backgroundColor: "#1e293b",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <div style={{
                        display: "flex",
                        height: "100%"
                      }}>
                        {/* Line Numbers */}
                        <div style={{
                          backgroundColor: "#0f172a",
                          color: "#64748b",
                          padding: "12px 8px",
                          fontFamily: "monospace",
                          fontSize: "0.85rem",
                          lineHeight: "1.5",
                          textAlign: "right",
                          userSelect: "none",
                          minWidth: "40px",
                          borderRight: "1px solid #334155"
                        }}>
                          {draftCode.split('\n').map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
                        {/* Code Editor */}
                        <textarea
                          id="html-editor-textarea"
                          value={draftCode}
                          onChange={e => setDraftCode(e.target.value)}
                          spellCheck={false}
                          style={{
                            flex: 1,
                            height: "100%",
                            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                            fontSize: "0.85rem",
                            padding: "12px",
                            border: "none",
                            backgroundColor: "#1e293b",
                            color: "#e2e8f0",
                            resize: "none",
                            outline: "none",
                            lineHeight: "1.5",
                            tabSize: 2,
                            whiteSpace: "pre",
                            overflowWrap: "normal",
                            overflowX: "auto"
                          }}
                          onKeyDown={(e) => {
                            // Tab key support
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const start = e.currentTarget.selectionStart;
                              const end = e.currentTarget.selectionEnd;
                              const newValue = draftCode.substring(0, start) + '  ' + draftCode.substring(end);
                              setDraftCode(newValue);
                              setTimeout(() => {
                                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                              }, 0);
                            }
                          }}
                        />
                      </div>
                      {/* Editor Info Bar */}
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        backgroundColor: "#0f172a",
                        color: "#64748b",
                        padding: "4px 12px",
                        fontSize: "0.7rem",
                        fontFamily: "monospace",
                        borderTopLeftRadius: "6px",
                        borderLeft: "1px solid #334155",
                        borderTop: "1px solid #334155"
                      }}>
                        Lines: {draftCode.split('\n').length} | Chars: {draftCode.length}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                      Live Sandbox Sandbox Preview
                    </span>
                    <Sandbox
                      htmlContent={draftCode}
                      onComplete={() => alert("Simulation Complete message received!")}
                      onAttempt={() => console.log("Simulation Attempt message")}
                    />
                  </div>
                )}

                {/* Tweak & Regenerate section */}
                <div style={{ marginTop: "20px", borderTop: "2px solid #cbd5e1", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label htmlFor="tweak-instructions-textarea" style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                    🪄 Tweak & Re-generate Activity (Add custom modifications)
                  </label>
                  <textarea
                    id="tweak-instructions-textarea"
                    rows={3}
                    placeholder="e.g. Change background color to neon green, or make interactive elements 20% larger..."
                    value={tweakInstruction}
                    onChange={e => setTweakInstruction(e.target.value)}
                    style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }}
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating || !tweakInstruction.trim()}
                    className="btn btn-primary"
                    style={{ alignSelf: "flex-start", padding: "10px 20px", fontSize: "0.85rem" }}
                  >
                    {isGenerating ? "AI Regenerating..." : "Apply Tweaks & Regenerate Code"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL PUBLISHED GAMES */}
        {activeTab === "games" && (
          <div className="play-card">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Active Subject Activities</h3>
            {games.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No activities created yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {games.map(game => (
                  <div key={game.id} className="admin-game-item">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>{game.title}</span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor: game.published ? "#d1fae5" : "#e2e8f0",
                            color: game.published ? "#065f46" : "#475569",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontWeight: "800"
                          }}
                        >
                          {game.published ? "Published" : "Draft / Hidden"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            backgroundColor: game.isFree !== false ? "#f1f5f9" : "#fee2e2",
                            color: game.isFree !== false ? "#475569" : "#991b1b",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontWeight: "800"
                          }}
                        >
                          {game.isFree !== false ? "🆓 Free" : "💎 Premium"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-secondary)", flexWrap: "wrap", alignItems: "center" }}>
                        <span>Topic: {game.topic}</span>
                        <span>•</span>
                        <span>Class: {game.class || "All"}</span>
                        <span>•</span>
                        <span style={{ fontWeight: "700" }}>{game.difficulty}</span>
                        <span>•</span>
                        <span style={{ color: "#16a34a", fontWeight: "700" }}>👍 {game.likes?.length || 0}</span>
                        <span>•</span>
                        <span style={{ color: "#dc2626", fontWeight: "700" }}>👎 {game.dislikes?.length || 0}</span>
                        <span>•</span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>Sort Order:</span>
                          <input
                            type="number"
                            defaultValue={game.order || 0}
                            onBlur={(e) => handleSaveGameOrder(game.id, parseInt(e.target.value))}
                            style={{
                              width: "55px",
                              padding: "2px 4px",
                              borderRadius: "6px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "0.7rem",
                              textAlign: "center"
                            }}
                          />
                        </div>
                        <span>•</span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span>Min Stars:</span>
                          <input
                            type="number"
                            defaultValue={game.starsRequired || 0}
                            onBlur={(e) => handleSaveGameStarsRequired(game.id, parseInt(e.target.value))}
                            style={{
                              width: "65px",
                              padding: "2px 4px",
                              borderRadius: "6px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "0.7rem",
                              textAlign: "center"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="admin-game-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
                      <button
                        onClick={() => handleToggleGameTier(game)}
                        className="btn"
                        style={{
                          padding: "8px",
                          backgroundColor: game.isFree !== false ? "#f1f5f9" : "#fee2e2",
                          color: game.isFree !== false ? "#64748b" : "#991b1b",
                          borderRadius: "10px",
                          boxShadow: "none"
                        }}
                        title={game.isFree !== false ? "Make Paid/Premium" : "Make Free"}
                      >
                        {game.isFree !== false ? <Unlock size={18} /> : <Lock size={18} />}
                      </button>

                      <button
                        onClick={() => handleTogglePublish(game)}
                        className="btn"
                        style={{
                          padding: "8px",
                          backgroundColor: game.published ? "#d1fae5" : "#f1f5f9",
                          color: game.published ? "#10b981" : "#64748b",
                          borderRadius: "10px",
                          boxShadow: "none"
                        }}
                        title={game.published ? "Unpublish Activity" : "Publish Activity"}
                      >
                        {game.published ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button
                        onClick={() => handleEditGame(game)}
                        className="btn"
                        style={{
                          padding: "8px",
                          backgroundColor: "#e0f2fe",
                          color: "#0284c7",
                          borderRadius: "10px",
                          boxShadow: "none"
                        }}
                        title="Edit game details & code"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="btn"
                        style={{
                          padding: "8px",
                          backgroundColor: "#fee2e2",
                          color: "#ef4444",
                          borderRadius: "10px",
                          boxShadow: "none"
                        }}
                        title="Delete game"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: STUDENT IDEAS & REQUESTS */}
        {activeTab === "requests" && (
          <div className="play-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ fontSize: "1.1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Lightbulb size={20} color="var(--accent-primary)" />
                <span>Student Game Requests ({gameRequests.length})</span>
              </h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Below are the game ideas and suggestions sent in by the students from their dashboards.
            </p>

            {gameRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #cbd5e1", borderRadius: "16px" }}>
                <Lightbulb size={48} color="#cbd5e1" style={{ marginBottom: "12px" }} />
                <p style={{ color: "var(--text-secondary)", fontWeight: "600", margin: 0 }}>
                  No game suggestions submitted yet.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {gameRequests.map((req) => (
                  <div
                    key={req.id}
                    className="play-card"
                    style={{
                      border: "2px solid #e2e8f0",
                      padding: "16px",
                      borderRadius: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "12px",
                      backgroundColor: "var(--bg-primary)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span style={{ fontWeight: "800", fontSize: "1rem", color: "var(--text-primary)" }}>
                            {req.studentName}
                          </span>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            Submitted: {new Date(req.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p
                        style={{
                          margin: "12px 0 0 0",
                          fontSize: "0.9rem",
                          color: "var(--text-primary)",
                          backgroundColor: "var(--bg-secondary)",
                          padding: "10px",
                          borderRadius: "12px",
                          borderLeft: "4px solid var(--accent-primary)",
                          lineHeight: "1.4",
                          whiteSpace: "pre-wrap"
                        }}
                      >
                        "{req.idea}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      className="btn"
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fee2e2",
                        border: "1.5px solid #fecaca",
                        color: "#b91c1c",
                        borderRadius: "10px",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Archive Idea</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS REPORTS */}
        {activeTab === "analytics" && (
          <div className="play-card">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Activity Analytics Log</h3>
            {logs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No student logs recorded yet.</p>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr style={{ borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                        <th>Student</th>
                        <th>Game</th>
                        <th>Duration</th>
                        <th>Attempts</th>
                        <th>Reward</th>
                        <th>Device Info</th>
                        <th>IP Address</th>
                        <th>Attempts History</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, visibleLogCount).map(log => (
                        <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ fontWeight: "700" }}>{log.studentName}</td>
                          <td>{log.gameTitle}</td>
                          <td>{log.duration}s</td>
                          <td>{log.attempts}</td>
                          <td style={{ color: "var(--success)", fontWeight: "700" }}>{log.rewardEarned}</td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                            {log.deviceType ? `${log.deviceType} (${log.browser})` : `${log.device} (${log.browser})`}
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{log.ip || "N/A"}</td>
                          <td>
                            {log.attemptsHistory && log.attemptsHistory.length > 0 ? (
                              <button
                                onClick={() => setSelectedDetailLog(log)}
                                className="btn"
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "var(--accent-primary)",
                                  color: "#ffffff",
                                  fontSize: "0.75rem",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  boxShadow: "none"
                                }}
                              >
                                🔍 View Attempts ({log.attemptsHistory.length})
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-mobile-cards">
                  {logs.slice(0, visibleLogCount).map(log => (
                    <div
                      key={log.id}
                      className="play-card"
                      style={{
                        padding: "16px",
                        border: "1.5px solid #cbd5e1",
                        backgroundColor: "var(--bg-primary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        borderRadius: "12px",
                        marginBottom: "12px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "1rem" }}>{log.studentName}</strong>
                        <span style={{ color: "var(--success)", fontWeight: "800", fontSize: "0.85rem" }}>{log.rewardEarned}</span>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <div><strong>Activity:</strong> <span style={{ color: "var(--text-primary)" }}>{log.gameTitle}</span></div>
                        <div><strong>Duration:</strong> {log.duration}s | <strong>Attempts:</strong> {log.attempts}</div>
                        <div><strong>Device:</strong> {log.deviceType ? `${log.deviceType} (${log.browser})` : `${log.device} (${log.browser})`}</div>
                        <div><strong>IP:</strong> {log.ip || "N/A"}</div>
                      </div>

                      {log.attemptsHistory && log.attemptsHistory.length > 0 ? (
                        <button
                          onClick={() => setSelectedDetailLog(log)}
                          className="btn btn-primary"
                          style={{
                            padding: "8px 12px",
                            width: "100%",
                            fontSize: "0.75rem",
                            marginTop: "6px",
                            borderRadius: "8px",
                            boxShadow: "none"
                          }}
                        >
                          🔍 View Attempts ({log.attemptsHistory.length})
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", display: "block", marginTop: "6px" }}>
                          No attempts recorded
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {logs.length > visibleLogCount && (
                  <div style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "700" }}>
                    ⏳ Scroll down to load more activity logs...
                  </div>
                )}
              </>
            )}

            {/* Action History Breakdown Modal */}
            {selectedDetailLog && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10000,
                  padding: "20px",
                  backdropFilter: "blur(4px)"
                }}
              >
                <div
                  className="play-card"
                  style={{
                    maxWidth: "500px",
                    width: "100%",
                    maxHeight: "85vh",
                    overflowY: "auto",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    backgroundColor: "var(--bg-secondary)",
                    border: "4px solid var(--accent-primary)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #cbd5e1", paddingBottom: "10px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0 }}>
                      📋 Attempt History Details
                    </h3>
                    <button
                      onClick={() => setSelectedDetailLog(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        fontWeight: "900",
                        color: "var(--text-secondary)"
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div>
                    <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>Student:</strong> {selectedDetailLog.studentName}</p>
                    <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>Activity:</strong> {selectedDetailLog.gameTitle}</p>
                    <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>Device ID:</strong> <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{selectedDetailLog.deviceId || "N/A"}</span></p>
                    <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>User Agent:</strong> <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{selectedDetailLog.userAgent || "Unknown"}</span></p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                    {selectedDetailLog.attemptsHistory?.map((attempt, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1.5px solid",
                          borderColor: attempt.success ? "#86efac" : "#fca5a5",
                          backgroundColor: attempt.success ? "#f0fdf4" : "#fff5f5",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, paddingRight: "10px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                            Q{index + 1}: {attempt.question}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            Answered: <strong style={{ color: "var(--text-primary)" }}>{attempt.answer}</strong>
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "800",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            color: attempt.success ? "#065f46" : "#b91c1c",
                            backgroundColor: attempt.success ? "#d1fae5" : "#fee2e2"
                          }}
                        >
                          {attempt.success ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedDetailLog(null)}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "10px", marginTop: "10px" }}
                  >
                    Close History
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={handleSaveSettings} className="play-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem" }}>Settings Configuration</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Configures AI generation keys and student difficulty parameters.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label htmlFor="gemini-api-key-input" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Google Gemini API Key</label>
                <input
                  id="gemini-api-key-input"
                  type="password"
                  placeholder="Enter Gemini API key (e.g. AIzaSy...)"
                  value={apiKeyInput || ""}
                  onChange={e => setApiKeyInput(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "2px solid #cbd5e1"
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Leaves empty to run with sandbox templates fallback.
                </span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "12px 24px" }}>
                Save Configuration
              </button>
            </form>

            {/* Manual Alert Broadcast Panel */}
            <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem" }}>📢 Push Notifications Broadcast</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Trigger manual alerts and broadcasts immediately to all active students.
                </p>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="noti-title-input" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Alert Title</label>
                  <input
                    id="noti-title-input"
                    type="text"
                    placeholder="e.g. New Challenge! 🏆"
                    value={manualNotiTitle}
                    onChange={e => setManualNotiTitle(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "2px solid #cbd5e1"
                    }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="noti-message-input" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Alert Message</label>
                  <textarea
                    id="noti-message-input"
                    placeholder="e.g. Try our new Addition Quest and score stars!"
                    value={manualNotiMessage}
                    onChange={e => setManualNotiMessage(e.target.value)}
                    rows={3}
                    style={{
                      padding: "10px",
                      borderRadius: "10px",
                      border: "2px solid #cbd5e1",
                      resize: "none"
                    }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSendManualNotification}
                className="btn btn-primary"
                style={{ alignSelf: "flex-start", padding: "12px 24px" }}
              >
                Send Alert Broadcast 🚀
              </button>
            </div>
          </div>
        )}

            {/* Pattern Lock Set Modal for Student */}
            {patternModalStudent && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(15, 23, 42, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10000,
                  padding: "20px",
                  backdropFilter: "blur(4px)"
                }}
              >
                <div
                  className="play-card"
                  style={{
                    maxWidth: "400px",
                    width: "100%",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    backgroundColor: "var(--bg-secondary)",
                    border: "4px solid var(--accent-primary)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #cbd5e1", paddingBottom: "10px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0 }}>
                      🔑 Set Pattern Lock
                    </h3>
                    <button
                      onClick={() => setPatternModalStudent(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        fontWeight: "900",
                        color: "var(--text-secondary)"
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "2px 0", fontSize: "0.95rem" }}>
                      Setting pattern for student: <strong>{patternModalStudent.name}</strong>
                    </p>
                    {patternModalStudent.patternLock ? (
                      <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: "700" }}>
                        ✓ Current Pattern: {patternModalStudent.patternLock}
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: "700" }}>
                        ⚠️ No Pattern Lock Set Yet
                      </span>
                    )}
                  </div>
                  <PatternLock
                    mode="set"
                    onSuccess={handleSaveStudentPattern}
                    onCancel={() => setPatternModalStudent(null)}
                  />
                </div>
              </div>
            )}

      </div>
    </div>
  );
};
export default AdminDashboard;
