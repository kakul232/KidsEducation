import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, Student } from "../../services/db";
import { generateGame } from "../../services/gemini";
import type { GeneratedGameResponse } from "../../services/gemini";
import Sandbox from "../../components/Sandbox";
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
  Edit2
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const {
    isAdminLoggedIn,
    logInAdmin,
    logOutAdmin,
    geminiApiKey,
    saveApiKey,
    setView
  } = useApp();

  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"stats" | "studio" | "games" | "analytics" | "settings">("stats");

  // Database lists
  const [students, setStudents] = useState<Student[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // AI Studio Generation Form States
  const [subject] = useState("Mathematics");
  const [topic, setTopic] = useState("Addition");
  const [age, setAge] = useState(5);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [assignedStudentId, setAssignedStudentId] = useState("");
  const [gameInstruction, setGameInstruction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<GeneratedGameResponse | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  
  // Custom edit state for draft code
  const [draftCode, setDraftCode] = useState("");
  const [codeEditMode, setCodeEditMode] = useState(false);

  // Settings
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadData();
    }
  }, [isAdminLoggedIn]);

  useEffect(() => {
    setApiKeyInput(geminiApiKey);
  }, [geminiApiKey]);

  const loadData = async () => {
    // Pre-populate defaults under authenticated admin context
    await LocalDB.prepopulateDefaultGames();

    const [studentsList, gamesList, logsList] = await Promise.all([
      LocalDB.getStudents(),
      LocalDB.getGames(),
      LocalDB.getLogs()
    ]);
    setStudents(studentsList);
    setGames(gamesList);
    setLogs(logsList);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    setAuthError("");
    try {
      await logInAdmin(email, password);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setAuthError("Invalid credentials. Please verify your email and password.");
      } else {
        setAuthError(err.message || "Authentication failed. Try again.");
      }
    }
  };

  // AI Generator trigger
  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedGame(null);
    setGenerationError("");
    setCodeEditMode(false);

    try {
      const result = await generateGame(subject, topic, age, difficulty, geminiApiKey, gameInstruction);
      setGeneratedGame(result);
      setDraftCode(result.htmlContent);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI generation failed. Verify API key and network.");
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
      age: generatedGame.age,
      difficulty: generatedGame.difficulty as any,
      htmlContent: draftCode, // Save current draft code (which includes any admin edits!)
      published: true,
      createdAt: new Date().toISOString(),
      assignedStudentId: assignedStudentId || undefined
    };

    await LocalDB.saveGame(newGame);
    await loadData();
    alert(editingGameId ? "Game successfully updated! ✏️" : "Game successfully published to students! 🎉");
    setGeneratedGame(null);
    setEditingGameId(null);
    setActiveTab("games");
  };

  const handleEditGame = (game: Game) => {
    setTopic(game.topic);
    setAge(game.age);
    setDifficulty(game.difficulty);
    setAssignedStudentId(game.assignedStudentId || "");
    setDraftCode(game.htmlContent);
    setGeneratedGame({
      title: game.title,
      topic: game.topic,
      age: game.age,
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
    setAge(5);
    setDifficulty("Easy");
    setAssignedStudentId("");
    setGameInstruction("");
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
    <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto", padding: "24px" }} className="animate-slide-up">
      
      {/* Admin Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          backgroundColor: "#fff",
          borderRadius: "20px",
          padding: "16px 24px",
          boxShadow: "var(--card-shadow)"
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.4rem", color: "var(--text-primary)" }}>🏫 Educator Dashboard</h1>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>School Management & AI Studio</span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
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
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Active Students</h3>
              {students.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>No students registered yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {students.map(std => (
                    <div
                      key={std.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px",
                        backgroundColor: "var(--bg-primary)",
                        borderRadius: "12px"
                      }}
                    >
                      <span style={{ fontWeight: "700" }}>{std.name}</span>
                      <span style={{ color: "#c2410c", fontWeight: "700" }}>⭐ {std.stars} Stars</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI STUDIO (GAME GENERATION) */}
        {activeTab === "studio" && (
          <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>
                  {editingGameId ? `✏️ Editing Game: ${generatedGame?.title}` : "Generate Interactive Activity"}
                </h3>
                {editingGameId && (
                  <button
                    onClick={handleCancelEdit}
                    className="btn"
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#f1f5f9",
                      border: "2px solid #cbd5e1",
                      borderRadius: "10px",
                      fontSize: "0.8rem",
                      boxShadow: "none"
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {editingGameId ? "Modify code below or tweak instructions and re-generate." : "Uses Gemini to output accessibly structured, dyslexia-friendly arithmetic HTML5 games."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
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
                <label htmlFor="age-selector-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Student Age</label>
                <select
                  id="age-selector-studio"
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1" }}
                >
                  <option value={5}>Age 5</option>
                  <option value={6}>Age 6</option>
                  <option value={7}>Age 7</option>
                  <option value={8}>Age 8</option>
                </select>
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

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", gridColumn: "span 2" }}>
                <label htmlFor="instruction-input-studio" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Optional Game Instructions (AI prompt helper)</label>
                <textarea
                  id="instruction-input-studio"
                  rows={3}
                  placeholder="e.g. Use space travel theme, include colorful planets, make it easy to count visual dots..."
                  value={gameInstruction}
                  onChange={e => setGameInstruction(e.target.value)}
                  style={{ padding: "12px", borderRadius: "10px", border: "2px solid #cbd5e1", resize: "vertical" }}
                />
              </div>
            </div>

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "1.1rem" }}>Result: {generatedGame.title}</h4>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setCodeEditMode(!codeEditMode)}
                      className="btn btn-gray"
                      style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                    >
                      {codeEditMode ? "View Sandbox" : "Edit HTML Code"}
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={!generatedGame.isValid}
                      className="btn btn-success"
                      style={{ padding: "8px 12px", fontSize: "0.8rem", boxShadow: "none" }}
                    >
                      {editingGameId ? "Save Changes" : "Publish Game"}
                    </button>
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
                    <label htmlFor="html-editor-textarea" style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                      HTML/CSS/JS Source Code
                    </label>
                    <textarea
                      id="html-editor-textarea"
                      value={draftCode}
                      onChange={e => setDraftCode(e.target.value)}
                      style={{
                        width: "100%",
                        height: "280px",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        padding: "12px",
                        borderRadius: "10px",
                        border: "2px solid #cbd5e1",
                        backgroundColor: "#f8fafc"
                      }}
                    />
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
                  <div
                    key={game.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      backgroundColor: "var(--bg-primary)",
                      borderRadius: "16px"
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>{game.title}</span>
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <span>Topic: {game.topic}</span>
                        <span>•</span>
                        <span>Age: {game.age}</span>
                        <span>•</span>
                        <span style={{ fontWeight: "700" }}>{game.difficulty}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
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

        {/* TAB 4: ANALYTICS REPORTS */}
        {activeTab === "analytics" && (
          <div className="play-card" style={{ overflowX: "auto" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Activity Analytics Log</h3>
            {logs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No student logs recorded yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Student</th>
                    <th style={{ padding: "8px" }}>Game</th>
                    <th style={{ padding: "8px" }}>Duration</th>
                    <th style={{ padding: "8px" }}>Attempts</th>
                    <th style={{ padding: "8px" }}>Reward</th>
                    <th style={{ padding: "8px" }}>Device</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "8px", fontWeight: "700" }}>{log.studentName}</td>
                      <td style={{ padding: "8px" }}>{log.gameTitle}</td>
                      <td style={{ padding: "8px" }}>{log.duration}s</td>
                      <td style={{ padding: "8px" }}>{log.attempts}</td>
                      <td style={{ padding: "8px", color: "var(--success)", fontWeight: "700" }}>{log.rewardEarned}</td>
                      <td style={{ padding: "8px", color: "var(--text-secondary)" }}>{log.device}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 5: ADMIN CONFIG SETTINGS */}
        {activeTab === "settings" && (
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
                value={apiKeyInput}
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
        )}

      </div>
    </div>
  );
};
export default AdminDashboard;
