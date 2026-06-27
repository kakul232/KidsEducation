import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game } from "../../services/db";
import { Trophy, Play, LogOut } from "lucide-react";
import { SUBJECTS } from "../../utils/constants";
import { AvatarIcon } from "../../components/AvatarIcon";
import { StarBadge } from "../../components/StarBadge";
import { StreakBadge } from "../../components/StreakBadge";
import { PlayCard } from "../../components/PlayCard";
import { ChunkyButton } from "../../components/ChunkyButton";

export const Dashboard: React.FC = () => {
  const { currentStudent, setPlayingGame } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("math");

  useEffect(() => {
    // Fetch published games from DB
    const fetchGames = async () => {
      const allGames = await LocalDB.getGames();
      const list = allGames.filter(
        g => g.published && (!g.assignedStudentId || g.assignedStudentId === currentStudent?.id)
      );
      setGames(list);
    };
    fetchGames();
  }, [currentStudent]);

  const handleStudentLogOut = () => {
    localStorage.removeItem("active_student_id");
    // Reload page or update view to reset state
    window.location.reload();
  };

  return (
    <div className="container animate-slide-up">
      {/* Student Profile Header using Reusable PlayCard, AvatarIcon, StarBadge and StreakBadge */}
      <PlayCard
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          marginBottom: "20px",
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "6px solid var(--accent-secondary)",
          borderTop: 0,
          borderLeft: 0,
          borderRight: 0,
          borderRadius: "var(--border-radius)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {currentStudent && <AvatarIcon avatarId={currentStudent.avatar} size="md" />}
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
              Hi, {currentStudent?.name || "Student"}!
            </h2>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Student Account</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <StarBadge count={currentStudent?.stars || 0} />
          <StreakBadge days={currentStudent?.streak || 1} />
        </div>
      </PlayCard>

      {/* Subject Selector using Reusable PlayCard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {SUBJECTS.map(subject => (
          <PlayCard
            key={subject.id}
            onClick={subject.enabled ? () => setSelectedSubject(subject.id) : undefined}
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
              gap: "6px"
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
          </PlayCard>
        ))}
      </div>

      {/* Games List for Subject */}
      <h3 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "var(--text-primary)" }}>
        Choose a Game:
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
        {games.length === 0 ? (
          <PlayCard style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #cbd5e1" }}>
            <Trophy size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              No games published yet. Wait for your teacher to create some! 😊
            </p>
          </PlayCard>
        ) : (
          games.map(game => (
            <PlayCard
              key={game.id}
              onClick={() => setPlayingGame(game)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--bg-secondary)",
                boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                padding: "20px"
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
            </PlayCard>
          ))
        )}
      </div>

      {/* Exit Dashboard using Reusable ChunkyButton */}
      <ChunkyButton
        onClick={handleStudentLogOut}
        variant="gray"
        style={{
          marginTop: "24px",
          padding: "12px 24px",
          fontSize: "0.95rem",
          boxShadow: "none",
          alignSelf: "center"
        }}
      >
        <LogOut size={16} />
        Exit Account
      </ChunkyButton>
    </div>
  );
};
export default Dashboard;
