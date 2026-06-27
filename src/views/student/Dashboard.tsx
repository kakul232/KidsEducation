import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game } from "../../services/db";
import { Star, Flame, Trophy, Play, LogOut } from "lucide-react";

const AVATAR_EMOJIS: Record<string, string> = {
  bear: "🐻",
  cat: "🐱",
  fox: "🦊",
  frog: "🐸",
  panda: "🐼"
};

const SUBJECTS = [
  { id: "math", title: "🧮 Mathematics", enabled: true, color: "#e0f2fe", border: "#38bdf8" },
  { id: "english", title: "📚 English", enabled: false, color: "#fef3c7", border: "#fbbf24" },
  { id: "science", title: "🔬 Science", enabled: false, color: "#dcfce7", border: "#4ade80" },
  { id: "coding", title: "💻 Coding", enabled: false, color: "#f3e8ff", border: "#c084fc" }
];

export const Dashboard: React.FC = () => {
  const { currentStudent, setPlayingGame } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("math");

  useEffect(() => {
    // Fetch published games from DB
    const list = LocalDB.getGames().filter(
      g => g.published && (!g.assignedStudentId || g.assignedStudentId === currentStudent?.id)
    );
    setGames(list);
  }, [currentStudent]);

  const handleStudentLogOut = () => {
    localStorage.removeItem("active_student_id");
    // Reload page or update view to reset state
    window.location.reload();
  };

  const getAvatarEmoji = (id: string) => {
    return AVATAR_EMOJIS[id] || "🧒";
  };

  return (
    <div className="container animate-slide-up">
      {/* Student Profile Header */}
      <div
        className="play-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          marginBottom: "20px",
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "6px solid var(--accent-secondary)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "2.5rem" }}>
            {currentStudent ? getAvatarEmoji(currentStudent.avatar) : "🧒"}
          </span>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
              Hi, {currentStudent?.name || "Student"}!
            </h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Student Account</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Star Counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "#fef9c3",
              border: "2px solid #facc15",
              borderRadius: "14px",
              padding: "6px 12px",
              fontWeight: "800",
              color: "#854d0e"
            }}
          >
            <Star size={18} fill="#facc15" color="#eab308" />
            <span>{currentStudent?.stars || 0}</span>
          </div>

          {/* Streak Counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "#ffedd5",
              border: "2px solid #fb923c",
              borderRadius: "14px",
              padding: "6px 12px",
              fontWeight: "800",
              color: "#c2410c"
            }}
          >
            <Flame size={18} fill="#fb923c" color="#ea580c" />
            <span>{currentStudent?.streak || 1}d</span>
          </div>
        </div>
      </div>

      {/* Subject Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {SUBJECTS.map(subject => (
          <button
            key={subject.id}
            disabled={!subject.enabled}
            onClick={() => setSelectedSubject(subject.id)}
            className="play-card"
            style={{
              backgroundColor: subject.color,
              borderColor: selectedSubject === subject.id ? "var(--text-primary)" : subject.border,
              borderWidth: "3px",
              borderStyle: selectedSubject === subject.id ? "solid" : "dashed",
              opacity: subject.enabled ? 1 : 0.6,
              cursor: subject.enabled ? "pointer" : "not-allowed",
              padding: "16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              boxShadow: "none"
            }}
          >
            <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1e293b" }}>
              {subject.title}
            </span>
            {!subject.enabled && (
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#64748b" }}>
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Games List for Subject */}
      <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "var(--text-primary)" }}>
        Choose a Game:
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        {games.length === 0 ? (
          <div
            className="play-card"
            style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #cbd5e1" }}
          >
            <Trophy size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              No games published yet. Wait for your teacher to create some! 😊
            </p>
          </div>
        ) : (
          games.map(game => (
            <button
              key={game.id}
              onClick={() => setPlayingGame(game)}
              className="play-card btn"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "left",
                backgroundColor: "var(--bg-secondary)",
                boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                padding: "20px",
                border: "3px solid #e2e8f0"
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    display: "block",
                    color: "var(--text-primary)",
                    wordSpacing: "0.1em"
                  }}
                >
                  {game.title}
                </span>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor: "var(--bg-primary)",
                      padding: "4px 10px",
                      borderRadius: "10px",
                      fontWeight: "700",
                      color: "var(--text-secondary)"
                    }}
                  >
                    Topic: {game.topic}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor:
                        game.difficulty === "Easy"
                          ? "#d1fae5"
                          : game.difficulty === "Medium"
                          ? "#ffedd5"
                          : "#fee2e2",
                      color:
                        game.difficulty === "Easy"
                          ? "#065f46"
                          : game.difficulty === "Medium"
                          ? "#9a3412"
                          : "#991b1b",
                      padding: "4px 10px",
                      borderRadius: "10px",
                      fontWeight: "700"
                    }}
                  >
                    {game.difficulty}
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 12px rgba(79, 70, 229, 0.3)"
                }}
              >
                <Play size={20} fill="#fff" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Exit Dashboard */}
      <button
        onClick={handleStudentLogOut}
        className="btn btn-gray"
        style={{
          marginTop: "24px",
          padding: "12px",
          fontSize: "0.95rem",
          boxShadow: "none",
          alignSelf: "center"
        }}
      >
        <LogOut size={16} />
        Exit Account
      </button>
    </div>
  );
};
export default Dashboard;
