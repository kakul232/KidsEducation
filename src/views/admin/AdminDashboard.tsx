import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, Student, GameRequest } from "../../services/db";
import { generateGame } from "../../services/gemini";
import type { GeneratedGameResponse } from "../../services/gemini";
import KidsLoader from "../../components/KidsLoader";
import {
  BarChart3,
  Cpu,
  BookOpen,
  History,
  Settings as SettingsIcon,
  Lightbulb
} from "lucide-react";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminHeader from "../../components/admin/AdminHeader";
import TabOverview from "../../components/admin/TabOverview";
import TabStudio from "../../components/admin/TabStudio";
import TabAllGames from "../../components/admin/TabAllGames";
import TabRequests from "../../components/admin/TabRequests";
import TabAnalytics from "../../components/admin/TabAnalytics";
import TabSettings from "../../components/admin/TabSettings";

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
      <AdminLogin
        isAuthLoading={isAuthLoading}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        handleLogin={handleLogin}
        setView={setView}
      />
    );
  }

  // Render Admin Dashboard layout
  return (
    <div className="admin-container animate-slide-up">
      {(isGenerating || isDataLoading) && <KidsLoader />}
      
      {/* Admin Header */}
      <AdminHeader setView={setView} logOutAdmin={logOutAdmin} />

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
          <TabOverview
            students={students}
            gamesCount={games.length}
            logsCount={logs.length}
            groupByPhone={groupByPhone}
            setGroupByPhone={setGroupByPhone}
            selectedStudentIds={selectedStudentIds}
            setSelectedStudentIds={setSelectedStudentIds}
            handleBulkPremiumStudents={handleBulkPremiumStudents}
            handleBulkFreeStudents={handleBulkFreeStudents}
            handleBulkDeleteStudents={handleBulkDeleteStudents}
            handleToggleSelectStudent={handleToggleSelectStudent}
            handleToggleStudentTier={handleToggleStudentTier}
            patternModalStudent={patternModalStudent}
            setPatternModalStudent={setPatternModalStudent}
            handleSaveStudentPattern={handleSaveStudentPattern}
            handleExtendValidity={handleExtendValidity}
          />
        )}

        {/* TAB 2: AI STUDIO (GAME GENERATION) */}
        {activeTab === "studio" && (
          <TabStudio
            editingGameId={editingGameId}
            geminiApiKey={geminiApiKey}
            handleCancelEdit={handleCancelEdit}
            assignedStudentId={assignedStudentId}
            setAssignedStudentId={setAssignedStudentId}
            students={students}
            topic={topic}
            setTopic={setTopic}
            selectedClasses={selectedClasses}
            setSelectedClasses={setSelectedClasses}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            rounds={rounds}
            setRounds={setRounds}
            aiTheme={aiTheme}
            handleThemeChange={handleThemeChange}
            gameInstruction={gameInstruction}
            setGameInstruction={setGameInstruction}
            handleAppendInstruction={handleAppendInstruction}
            includeSound={includeSound}
            setIncludeSound={setIncludeSound}
            dyslexiaTypography={dyslexiaTypography}
            setDyslexiaTypography={setDyslexiaTypography}
            handleGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationError={generationError}
            generatedGame={generatedGame}
            handleTitleChange={handleTitleChange}
            codeEditMode={codeEditMode}
            setCodeEditMode={setCodeEditMode}
            handleSaveAsDraft={handleSaveAsDraft}
            handlePublish={handlePublish}
            draftCode={draftCode}
            setDraftCode={setDraftCode}
            handleClearHtml={handleClearHtml}
            tweakInstruction={tweakInstruction}
            setTweakInstruction={setTweakInstruction}
            handleRegenerate={handleRegenerate}
          />
        )}

        {/* TAB 3: ALL PUBLISHED GAMES */}
        {activeTab === "games" && (
          <TabAllGames
            games={games}
            handleSaveGameOrder={handleSaveGameOrder}
            handleSaveGameStarsRequired={handleSaveGameStarsRequired}
            handleToggleGameTier={handleToggleGameTier}
            handleTogglePublish={handleTogglePublish}
            handleEditGame={handleEditGame}
            handleDeleteGame={handleDeleteGame}
          />
        )}

        {/* TAB 4: STUDENT IDEAS & REQUESTS */}
        {activeTab === "requests" && (
          <TabRequests
            gameRequests={gameRequests}
            handleDeleteRequest={handleDeleteRequest}
          />
        )}

        {/* TAB 5: ANALYTICS REPORTS */}
        {activeTab === "analytics" && (
          <TabAnalytics
            logs={logs}
            visibleLogCount={visibleLogCount}
            selectedDetailLog={selectedDetailLog}
            setSelectedDetailLog={setSelectedDetailLog}
          />
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <TabSettings
            apiKeyInput={apiKeyInput}
            setApiKeyInput={setApiKeyInput}
            handleSaveSettings={handleSaveSettings}
            manualNotiTitle={manualNotiTitle}
            setManualNotiTitle={setManualNotiTitle}
            manualNotiMessage={manualNotiMessage}
            setManualNotiMessage={setManualNotiMessage}
            handleSendManualNotification={handleSendManualNotification}
          />
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;
