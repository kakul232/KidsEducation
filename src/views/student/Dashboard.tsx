import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog } from "../../services/db";
import { Trophy, Play, Lock, Send } from "lucide-react";
import { SUBJECTS } from "../../utils/constants";
import { AvatarIcon } from "../../components/AvatarIcon";
import { StarBadge } from "../../components/StarBadge";
import { StreakBadge } from "../../components/StreakBadge";
import { PlayCard } from "../../components/PlayCard";
import KidsLoader from "../../components/KidsLoader";

const DIFFICULTY_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bg: string }> = {
  Easy: { symbol: "🌱", label: "Seedling", color: "#15803d", bg: "#d1fae5" },
  Medium: { symbol: "🌿", label: "Sapling", color: "#c2410c", bg: "#ffedd5" },
  Hard: { symbol: "🌳", label: "Big Tree", color: "#b91c1c", bg: "#fee2e2" }
};

const parseGameTitle = (fullTitle: string) => {
  const emojiRegex = /^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2000}-\u{3300}])/u;
  const trimmed = fullTitle.trim();
  const match = trimmed.match(emojiRegex);
  if (match) {
    const emoji = match[1];
    const rest = trimmed.substring(emoji.length).trim();
    return { emoji, cleanTitle: rest };
  }
  return { emoji: "🎮", cleanTitle: trimmed };
};

export const Dashboard: React.FC = () => {
  const { currentStudent, setPlayingGame, installPrompt, triggerInstall, notiPermission, requestNotiPermission, speakText } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [completedGames, setCompletedGames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(LocalDB.getCachedGames().length === 0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Modals & game requests states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestIdeaText, setRequestIdeaText] = useState("");
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedGameTitle, setLockedGameTitle] = useState("");
  const [lockedReason, setLockedReason] = useState<"premium" | "stars">("premium");
  const [lockedStarsRequired, setLockedStarsRequired] = useState(0);
  const [showIdeaSuccess, setShowIdeaSuccess] = useState(false);

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

      // Sort: Unlocked & Uncompleted first, then Unlocked & Completed, then Locked/Upcoming
      const sorted = [...list].sort((a, b) => {
        const aPremiumLocked = a.isFree === false && currentStudent?.tier !== "paid";
        const aStarLocked = a.starsRequired ? (currentStudent?.stars || 0) < a.starsRequired : false;
        const aLocked = aPremiumLocked || aStarLocked;

        const bPremiumLocked = b.isFree === false && currentStudent?.tier !== "paid";
        const bStarLocked = b.starsRequired ? (currentStudent?.stars || 0) < b.starsRequired : false;
        const bLocked = bPremiumLocked || bStarLocked;

        const aCompleted = !!completedMap[a.id];
        const bCompleted = !!completedMap[b.id];

        // Determine category weights (lower weight = higher display priority)
        let aWeight = 1; // Unlocked & Uncompleted
        if (aLocked) {
          aWeight = 3; // Locked/Upcoming
        } else if (aCompleted) {
          aWeight = 2; // Unlocked & Completed
        }

        let bWeight = 1; // Unlocked & Uncompleted
        if (bLocked) {
          bWeight = 3; // Locked/Upcoming
        } else if (bCompleted) {
          bWeight = 2; // Unlocked & Completed
        }

        if (aWeight !== bWeight) {
          return aWeight - bWeight;
        }

        // If they are in the same category, tie-breaker:
        if (aLocked && bLocked) {
          // Locked games sort by starsRequired ascending (e.g. 300, then 400, then 500...)
          const aStars = a.starsRequired !== undefined ? a.starsRequired : 999999;
          const bStars = b.starsRequired !== undefined ? b.starsRequired : 999999;
          if (aStars !== bStars) {
            return aStars - bStars;
          }
        }

        // Otherwise, sort by Custom Admin Ordering
        const aOrder = a.order !== undefined ? a.order : 99999;
        const bOrder = b.order !== undefined ? b.order : 99999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Tertiary sort: Newest first
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

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestIdeaText.trim()) return;

    setIsSubmittingIdea(true);
    try {
      const ideaId = "req_" + Date.now();
      const newRequest = {
        id: ideaId,
        studentId: currentStudent?.id || "guest",
        studentName: currentStudent?.name || "Guest Student",
        idea: requestIdeaText.trim(),
        createdAt: new Date().toISOString()
      };

      await LocalDB.saveGameRequest(newRequest);
      speakText("Idea sent! Thank you for sharing your suggestion!");
      setRequestIdeaText("");
      setShowRequestModal(false);
      setShowIdeaSuccess(true);
    } catch (err) {
      console.error("Failed to save student request:", err);
      alert("Oops! Failed to submit your idea. Try again!");
    } finally {
      setIsSubmittingIdea(false);
    }
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

  // Check student validity expiration
  const isExpired = currentStudent?.validUntil && new Date() > new Date(currentStudent.validUntil);

  if (isExpired && currentStudent) {
    return (
      <div className="container animate-slide-up" style={{ justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <PlayCard
          style={{
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            padding: "40px 24px",
            border: "4px solid var(--accent-primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px"
          }}
        >
          <div style={{ fontSize: "4.5rem" }}>⏰</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--text-primary)", margin: 0 }}>
            Time to Renew! 🌟
          </h2>
          <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "1.05rem", margin: 0, lineHeight: "1.5" }}>
            Hi {currentStudent.name}! Your learning dashboard validity has ended.
            Please ask your parents or teacher to renew it so you can keep playing and earning stars!
          </p>

          <div
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "2px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "16px",
              width: "100%",
              fontSize: "0.95rem",
              textAlign: "left"
            }}
          >
            <p style={{ margin: "4px 0" }}><strong>Registered Phone:</strong> {currentStudent.phone || "N/A"}</p>
            <p style={{ margin: "4px 0" }}><strong>Student ID:</strong> <span style={{ fontFamily: "monospace" }}>{currentStudent.id}</span></p>
          </div>

          <button
            onClick={handleStudentLogOut}
            className="btn"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "1rem",
              backgroundColor: "#fee2e2",
              border: "2px solid #fca5a5",
              color: "#b91c1c",
              borderRadius: "12px",
              fontWeight: "800",
              cursor: "pointer"
            }}
          >
            🚪 Change Account
          </button>
        </PlayCard>
      </div>
    );
  }

  return (
    <div className="container animate-slide-up">
      {isLoading && <KidsLoader />}
      {/* Student Profile Header using Reusable PlayCard, AvatarIcon, StarBadge and StreakBadge */}
      <PlayCard
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
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

      {/* Custom Add to Homescreen install prompt for PWA support */}
      {installPrompt && (
        <PlayCard
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "12px 18px",
            backgroundColor: "#e0f2fe",
            borderColor: "#38bdf8",
            borderWidth: "2.5px",
            borderStyle: "solid",
            marginBottom: "20px",
            borderRadius: "16px",
            boxShadow: "0 4px 0 #0284c7"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>📱</span>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#0369a1" }}>Install app on your phone!</strong>
              <span style={{ fontSize: "0.8rem", color: "#0284c7" }}>Play games faster from your homescreen!</span>
            </div>
          </div>
          <button
            onClick={triggerInstall}
            className="btn"
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--accent-secondary)",
              color: "#ffffff",
              fontSize: "0.85rem",
              borderRadius: "10px",
              fontWeight: "800",
              boxShadow: "0 3px 0 #0284c7",
              border: "none",
              cursor: "pointer"
            }}
          >
            📥 Install
          </button>
        </PlayCard>
      )}

      {/* Custom PWA Push Notification permission prompt banner */}
      {notiPermission === "default" && (
        <PlayCard
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "12px 18px",
            backgroundColor: "#fef2f2",
            borderColor: "#fca5a5",
            borderWidth: "2.5px",
            borderStyle: "solid",
            marginBottom: "20px",
            borderRadius: "16px",
            boxShadow: "0 4px 0 #ef4444"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>🔔</span>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#991b1b" }}>Turn on Game Alerts!</strong>
              <span style={{ fontSize: "0.85rem", color: "#b91c1c" }}>Get notified when new games are ready to play! ✨</span>
            </div>
          </div>
          <button
            onClick={requestNotiPermission}
            className="btn"
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--accent-primary)",
              color: "#ffffff",
              fontSize: "0.85rem",
              borderRadius: "10px",
              fontWeight: "800",
              boxShadow: "0 3px 0 #b91c1c",
              border: "none",
              cursor: "pointer"
            }}
          >
            Alert Me!
          </button>
        </PlayCard>
      )}

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

      {/* Games List for Subject with list/grid toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: 0 }}>
          Choose a Game:
        </h3>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              borderRadius: "10px",
              border: "2px solid #cbd5e1",
              backgroundColor: viewMode === "list" ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: viewMode === "list" ? "#ffffff" : "var(--text-primary)",
              fontWeight: "800",
              cursor: "pointer"
            }}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              borderRadius: "10px",
              border: "2px solid #cbd5e1",
              backgroundColor: viewMode === "grid" ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: viewMode === "grid" ? "#ffffff" : "var(--text-primary)",
              fontWeight: "800",
              cursor: "pointer"
            }}
          >
            🎛️ Grid
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {games.length === 0 ? (
          <PlayCard style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #cbd5e1" }}>
            <Trophy size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              No games published yet. Wait for your teacher to create some! 😊
            </p>
          </PlayCard>
        ) : (
          <div
            style={
              viewMode === "list"
                ? { display: "flex", flexDirection: "column", gap: "16px" }
                : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }
            }
          >
            {games.map(game => {
              const { emoji, cleanTitle } = parseGameTitle(game.title);
              const isPremiumLocked = game.isFree === false && currentStudent?.tier !== "paid";
              const isStarLocked = game.starsRequired ? (currentStudent?.stars || 0) < game.starsRequired : false;
              const isGameLocked = isPremiumLocked || isStarLocked;
              return (
                <PlayCard
                  key={game.id}
                  onClick={() => {
                    if (isGameLocked) {
                      if (isStarLocked) {
                        speakText(`Ooh! You need ${game.starsRequired} Stars to play ${cleanTitle}! You currently have ${currentStudent?.stars || 0} stars. Keep playing to earn more!`);
                        setLockedGameTitle(cleanTitle);
                        setLockedReason("stars");
                        setLockedStarsRequired(game.starsRequired || 0);
                        setShowLockModal(true);
                      } else {
                        speakText(`Ooh! ${cleanTitle} is a premium game! Ask your teacher or parent to unlock it.`);
                        setLockedGameTitle(cleanTitle);
                        setLockedReason("premium");
                        setShowLockModal(true);
                      }
                    } else {
                      setPlayingGame(game);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: viewMode === "list" ? "row" : "column",
                    alignItems: viewMode === "list" ? "center" : "stretch",
                    backgroundColor: completedGames[game.id] ? "#f0fdf4" : "var(--bg-secondary)",
                    borderColor: completedGames[game.id] ? "#86efac" : "#e2e8f0",
                    borderWidth: "3px",
                    borderStyle: "solid",
                    boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                    padding: viewMode === "list" ? "16px 20px" : "20px 16px",
                    gap: "16px",
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  {/* Premium / Star Lock Overlay Badge */}
                  {isGameLocked && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: isStarLocked ? "12px" : "50%",
                        padding: isStarLocked ? "4px 8px" : "0",
                        height: isStarLocked ? "auto" : "30px",
                        minWidth: isStarLocked ? "auto" : "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 8px rgba(239, 68, 68, 0.4)",
                        border: "2.5px solid white",
                        fontSize: isStarLocked ? "0.7rem" : "inherit",
                        fontWeight: "900",
                        zIndex: 5
                      }}
                      title={isStarLocked ? `Requires ${game.starsRequired} Stars` : "Premium Game"}
                    >
                      {isStarLocked ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap" }}>
                          🔒 {game.starsRequired} ⭐
                        </span>
                      ) : (
                        <Lock size={12} fill="white" />
                      )}
                    </div>
                  )}

                  {/* Big Game Logo */}
                  <div
                    style={{
                      fontSize: viewMode === "list" ? "2.2rem" : "2.8rem",
                      width: viewMode === "list" ? "60px" : "80px",
                      height: viewMode === "list" ? "60px" : "80px",
                      minWidth: viewMode === "list" ? "60px" : "80px",
                      borderRadius: viewMode === "list" ? "16px" : "22px",
                      backgroundColor: completedGames[game.id] ? "#d1fae5" : "var(--bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.05)",
                      margin: viewMode === "list" ? "0" : "0 auto 8px auto",
                      alignSelf: "center"
                    }}
                  >
                    {emoji}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, textAlign: viewMode === "list" ? "left" : "center" }}>
                    <span
                      style={{
                        fontSize: viewMode === "list" ? "1.2rem" : "1.05rem",
                        fontWeight: "800",
                        display: "flex",
                        flexDirection: viewMode === "list" ? "row" : "column",
                        alignItems: "center",
                        justifyContent: viewMode === "list" ? "flex-start" : "center",
                        flexWrap: "wrap",
                        color: "var(--text-primary)",
                        wordSpacing: "0.1em",
                        lineHeight: "1.2"
                      }}
                    >
                      <span>{cleanTitle}</span>

                      {/* Animated NEW Tag for newly published games, hiding if completed */}
                      {isNew(game.createdAt) && !completedGames[game.id] && (
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
                            marginLeft: viewMode === "list" ? "10px" : "0",
                            marginTop: viewMode === "list" ? "0" : "6px",
                            lineHeight: "1"
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: viewMode === "list" ? "flex-start" : "center" }}>
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
                          title="Replay this activity to earn even more stars!"
                        >
                          {viewMode === "list" 
                            ? `✓ Done (${completedGames[game.id]}) • Replay to earn stars! 🌟`
                            : `✓ Done (${completedGames[game.id]}) • Replay! 🌟`
                          }
                        </span>
                      )}

                      {/* Premium Game badge indicator */}
                      {game.isFree === false && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            padding: "4px 10px",
                            borderRadius: "10px",
                            fontWeight: "800",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          💎 Premium
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: viewMode === "list" ? "flex-end" : "center",
                      alignItems: "center",
                      marginTop: viewMode === "list" ? 0 : "8px"
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isGameLocked ? "#cbd5e1" : "var(--accent-primary)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isGameLocked ? "none" : "0 6px 12px rgba(79, 70, 229, 0.3)"
                      }}
                    >
                      {isGameLocked ? <Lock size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
                    </div>
                  </div>
                </PlayCard>
              );
            })}

            {/* Special "Ask for More / Idea Lightbulb" Tile Card */}
            <PlayCard
              onClick={() => {
                speakText("Do you want to share a game idea with your teacher? Tap here!");
                setShowRequestModal(true);
              }}
              style={{
                display: "flex",
                flexDirection: viewMode === "list" ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--accent-primary)",
                borderWidth: "3px",
                borderStyle: "dashed",
                boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                padding: "20px 16px",
                gap: "16px",
                cursor: "pointer",
                textAlign: "center",
                minHeight: viewMode === "list" ? "auto" : "180px"
              }}
            >
              <div
                style={{
                  fontSize: viewMode === "list" ? "2.2rem" : "2.8rem",
                  color: "var(--accent-primary)",
                  animation: "kids-wiggle 2.5s infinite ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: viewMode === "list" ? "60px" : "80px",
                  height: viewMode === "list" ? "60px" : "80px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(79, 70, 229, 0.1)"
                }}
              >
                💡
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                  Ask for More!
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Share your fun game idea with your teacher!
                </span>
              </div>
            </PlayCard>
          </div>
        )}
      </div>

      {/* Exit Dashboard using kids-friendly exit door */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "28px", marginBottom: "10px" }}>
        <button
          onClick={() => setShowExitConfirm(true)}
          style={{
            width: "55px",
            height: "55px",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            border: "4px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.7rem",
            cursor: "pointer",
            boxShadow: "0 6px 0 #ef4444",
            outline: "none"
          }}
          title="Exit Account"
        >
          🚪
        </button>
      </div>

      {/* Accidental Log-out protection modal */}
      {showExitConfirm && (
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
            zIndex: 1000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "350px",
              width: "100%",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)"
            }}
          >
            <div style={{ fontSize: "3.5rem", animation: "bounce 2s infinite" }}>🚪</div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: "900", color: "var(--text-primary)", margin: 0 }}>
              Are you leaving?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
              Do you really want to close your dashboard and exit?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-success"
                style={{ width: "100%", padding: "14px", fontSize: "1.1rem", fontWeight: "800", boxShadow: "0 4px 0 #16a34a" }}
              >
                🎮 Keep Playing!
              </button>
              <button
                onClick={handleStudentLogOut}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "0.85rem",
                  backgroundColor: "#fee2e2",
                  border: "2px solid #fca5a5",
                  color: "#b91c1c",
                  borderRadius: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  marginTop: "8px"
                }}
              >
                🚪 Yes, Exit
              </button>
            </div>
          </PlayCard>
        </div>
      )}

      {/* 1. Request Game Idea Modal */}
      {showRequestModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)",
              borderRadius: "24px",
              boxShadow: "0 12px 24px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px dashed #cbd5e1", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💡 Shared Idea Studio</span>
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.8rem",
                  cursor: "pointer",
                  fontWeight: "900",
                  color: "var(--text-secondary)"
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitIdea} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.4" }}>
                What kind of game do you want to play? Write or describe your game idea below:
              </p>

              <textarea
                value={requestIdeaText}
                onChange={(e) => setRequestIdeaText(e.target.value)}
                placeholder="E.g., 'I want a balloon counting game with cute dinosaurs!' or 'A puzzle game where I match shapes!'"
                rows={4}
                required
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "2px solid #cbd5e1",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  resize: "none",
                  boxSizing: "border-box",
                  backgroundColor: "var(--bg-primary)"
                }}
              />

              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn btn-gray"
                  style={{ flex: 1, padding: "12px", fontSize: "0.95rem", fontWeight: "800" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIdea}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 0 var(--accent-secondary)"
                  }}
                >
                  <Send size={16} fill="white" />
                  <span>{isSubmittingIdea ? "Sending..." : "Send Idea! 🚀"}</span>
                </button>
              </div>
            </form>
          </PlayCard>
        </div>
      )}

      {/* 2. Idea Success Confetti Popup */}
      {showIdeaSuccess && (
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
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid #10b981",
              borderRadius: "24px"
            }}
          >
            <div style={{ fontSize: "3.5rem", animation: "kids-bounce 2s infinite ease-in-out" }}>🎉</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#065f46", margin: 0 }}>
              Idea Sent! Yay!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
              Your game suggestion was sent straight to your teacher! Keep checking your dashboard for new games!
            </p>
            <button
              onClick={() => setShowIdeaSuccess(false)}
              className="btn btn-success"
              style={{ width: "100%", padding: "14px", fontSize: "1.05rem", fontWeight: "800", boxShadow: "0 4px 0 #16a34a" }}
            >
              Okay! 🎈
            </button>
          </PlayCard>
        </div>
      )}

      {/* 3. Premium Locked Game Dialog */}
      {showLockModal && (
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
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid #ef4444",
              borderRadius: "24px"
            }}
          >
            <div style={{ fontSize: "3.5rem", animation: "kids-wiggle 2s infinite ease-in-out" }}>
              {lockedReason === "stars" ? "⭐" : "🔒"}
            </div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: "900", color: lockedReason === "stars" ? "#b45309" : "#b91c1c", margin: 0 }}>
              {lockedReason === "stars" ? "Stars Required!" : "Premium Game!"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
              {lockedReason === "stars" ? (
                <span>
                  You need <strong>{lockedStarsRequired.toLocaleString()}</strong> Stars to unlock "{lockedGameTitle}".<br />
                  You currently have <strong>{currentStudent?.stars || 0}</strong> stars. Keep playing to collect more! 🎈
                </span>
              ) : (
                <span>
                  "{lockedGameTitle}" is a premium quest. Please ask your parent or teacher to unlock it for you!
                </span>
              )}
            </p>
            <button
              onClick={() => setShowLockModal(false)}
              className="btn btn-danger"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1.05rem",
                fontWeight: "800",
                backgroundColor: lockedReason === "stars" ? "#d97706" : "#ef4444",
                borderColor: lockedReason === "stars" ? "#b45309" : "#dc2626",
                color: "#ffffff",
                boxShadow: `0 4px 0 ${lockedReason === "stars" ? "#b45309" : "#dc2626"}`
              }}
            >
              {lockedReason === "stars" ? "Okay! 🎮" : "Go Back"}
            </button>
          </PlayCard>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
