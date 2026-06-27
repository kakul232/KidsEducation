import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog } from "../../services/db";
import { Trophy, Play, LogOut } from "lucide-react";
import { SUBJECTS } from "../../utils/constants";
import { AvatarIcon } from "../../components/AvatarIcon";
import { StarBadge } from "../../components/StarBadge";
import { StreakBadge } from "../../components/StreakBadge";
import { PlayCard } from "../../components/PlayCard";
import { ChunkyButton } from "../../components/ChunkyButton";
import KidsLoader from "../../components/KidsLoader";

const DIFFICULTY_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bg: string }> = {
  Easy: { symbol: "🌱", label: "Seedling", color: "#15803d", bg: "#d1fae5" },
  Medium: { symbol: "🌿", label: "Sapling", color: "#c2410c", bg: "#ffedd5" },
  Hard: { symbol: "🌳", label: "Big Tree", color: "#b91c1c", bg: "#fee2e2" }
};

export const Dashboard: React.FC = () => {
  const { currentStudent, setPlayingGame } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [completedGames, setCompletedGames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(LocalDB.getCachedGames().length === 0);

  useEffect(() => {
    // 1. Helper to render games & logs from a given data set
    const renderGamesAndLogs = (allGames: Game[], allLogs: ActivityLog[]) => {
      const list = allGames.filter(
        g => g.published && (!g.assignedStudentId || g.assignedStudentId === currentStudent?.id)
      );

      // Build completed games lookup map for current student
      const completedMap: Record<string, string> = {};
      if (currentStudent) {
        const studentLogs = allLogs.filter(l => l.studentId === currentStudent.id);
        studentLogs.forEach(log => {
          if (log.completionRate === 100) {
            completedMap[log.gameId] = log.rewardEarned || "⭐ Completed";
          }
        });
        setCompletedGames(completedMap);
      }

      // Sort: Uncompleted games first, completed games pushed to the bottom
      const sorted = [...list].sort((a, b) => {
        const aCompleted = !!completedMap[a.id];
        const bCompleted = !!completedMap[b.id];
        
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        
        // Secondary sort: Newest first
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setGames(sorted);
    };

    // 2. Synchronous Immediate load from local storage cache
    const cachedGames = LocalDB.getCachedGames();
    const cachedLogs = LocalDB.getCachedLogs();
    
    // If we have cached games, show them immediately! If not, wait for network or local fallback
    if (cachedGames.length > 0) {
      renderGamesAndLogs(cachedGames, cachedLogs);
    }

    // 3. Background Revalidation (check internet & refresh from Firestore)
    const fetchFreshData = async () => {
      try {
        const [freshGames, freshLogs] = await Promise.all([
          LocalDB.getGames(),
          LocalDB.getLogs()
        ]);
        
        // Update states silently in the background
        renderGamesAndLogs(freshGames, freshLogs);
      } catch (err) {
        console.warn("Background revalidation failed (offline/error):", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFreshData();
  }, [currentStudent]);

  const handleStudentLogOut = () => {
    localStorage.removeItem("active_student_id");
    // Reload page or update view to reset state
    window.location.reload();
  };

  const isNew = (createdAtString?: string) => {
    if (!createdAtString) return false;
    try {
      const createdTime = new Date(createdAtString).getTime();
      const currentTime = new Date().getTime();
      const diffHours = (currentTime - createdTime) / (1000 * 60 * 60);
      return diffHours < 24; // Show "NEW" tag if created in the last 24 hours
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="container animate-slide-up">
      {isLoading && <KidsLoader />}
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
                backgroundColor: completedGames[game.id] ? "#f0fdf4" : "var(--bg-secondary)",
                borderColor: completedGames[game.id] ? "#86efac" : "#e2e8f0",
                borderWidth: "3px",
                borderStyle: "solid",
                boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                padding: "20px"
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    color: "var(--text-primary)",
                    wordSpacing: "0.1em"
                  }}
                >
                  {game.title}
                  
                  {/* Animated NEW Tag for newly published games */}
                  {isNew(game.createdAt) && (
                    <span
                      className="animate-tag-pulse"
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "#f43f5e",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "8px",
                        fontWeight: "900",
                        letterSpacing: "0.05em",
                        marginLeft: "10px",
                        lineHeight: "1"
                      }}
                    >
                      NEW
                    </span>
                  )}
                </span>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
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
                  {(() => {
                    const diff = DIFFICULTY_SYMBOLS[game.difficulty] || DIFFICULTY_SYMBOLS.Easy;
                    return (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          backgroundColor: diff.bg,
                          color: diff.color,
                          padding: "4px 10px",
                          borderRadius: "10px",
                          fontWeight: "800",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <span>{diff.symbol}</span>
                        <span>{diff.label}</span>
                      </span>
                    );
                  })()}

                  {/* Completed star rewards indicator */}
                  {completedGames[game.id] && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        backgroundColor: "#d1fae5",
                        color: "#065f46",
                        padding: "4px 10px",
                        borderRadius: "10px",
                        fontWeight: "800",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      ✓ Done ({completedGames[game.id]})
                    </span>
                  )}
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
