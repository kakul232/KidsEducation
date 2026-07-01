import React from "react";
import { Trophy, Play, Lock, RotateCcw } from "lucide-react";
import type { Game, Student } from "../../services/db";
import { PlayCard } from "../PlayCard";

interface GameListProps {
  games: Game[];
  viewMode: "list" | "grid";
  completedGames: Record<string, string>;
  currentStudent: Student | null;
  isPremium: (student: Student | null) => boolean;
  isNew: (createdAt?: string) => boolean;
  parseGameTitle: (title: string) => { emoji: string; cleanTitle: string };
  DIFFICULTY_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bg: string }>;
  onPlayGame: (game: Game) => void;
  onShowLockModal: (title: string, reason: "premium" | "stars", starsRequired: number) => void;
  speakText: (text: string) => void;
  visibleGameCount: number;
  showRequestModalToggle: () => void;
}

export const GameList: React.FC<GameListProps> = ({
  games,
  viewMode,
  completedGames,
  currentStudent,
  isPremium,
  isNew,
  parseGameTitle,
  DIFFICULTY_SYMBOLS,
  onPlayGame,
  onShowLockModal,
  speakText,
  visibleGameCount,
  showRequestModalToggle
}) => {
  return (
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
          {games.slice(0, visibleGameCount).map(game => {
            const { emoji, cleanTitle } = parseGameTitle(game.title);
            const isPremiumLocked = game.isFree === false && !isPremium(currentStudent);
            const isStarLocked = game.starsRequired ? (currentStudent?.stars || 0) < game.starsRequired : false;
            const isGameLocked = isPremiumLocked || isStarLocked;
            return (
              <PlayCard
                key={game.id}
                onClick={() => {
                  if (isGameLocked) {
                    if (isStarLocked) {
                      speakText(`Ooh! You need ${game.starsRequired} Stars to play ${cleanTitle}! You currently have ${currentStudent?.stars || 0} stars. Keep playing to earn more!`);
                      onShowLockModal(cleanTitle, "stars", game.starsRequired || 0);
                    } else {
                      speakText(`Ooh! ${cleanTitle} is a premium game! Ask your teacher or parent to unlock it.`);
                      onShowLockModal(cleanTitle, "premium", 0);
                    }
                  } else {
                    onPlayGame(game);
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

                    {/* Preview Upcoming Game tag if game is not published */}
                    {!game.published && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#f59e0b",
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
                        Preview Upcoming Game
                      </span>
                    )}

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
                          fontSize: "0.75rem",
                          backgroundColor: "#d1fae5",
                          color: "#065f46",
                          padding: "4px 8px",
                          borderRadius: "10px",
                          fontWeight: "800",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          whiteSpace: "nowrap"
                        }}
                        title="Replay this activity to earn even more stars!"
                      >
                        ✓ Done ({completedGames[game.id]})
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
                      backgroundColor: isGameLocked ? "#cbd5e1" : completedGames[game.id] ? "#10b981" : "var(--accent-primary)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "48px",
                      height: "48px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isGameLocked ? "none" : completedGames[game.id] ? "0 6px 12px rgba(16, 185, 129, 0.3)" : "0 6px 12px rgba(79, 70, 229, 0.3)"
                    }}
                  >
                    {isGameLocked ? (
                      <Lock size={20} fill="#fff" />
                    ) : completedGames[game.id] ? (
                      <RotateCcw size={20} />
                    ) : (
                      <Play size={20} fill="#fff" />
                    )}
                  </div>
                </div>
              </PlayCard>
            );
          })}

          {/* Special "Ask for More / Idea Lightbulb" Tile Card */}
          <PlayCard
            onClick={() => {
              speakText("Do you want to share a game idea with your teacher? Tap here!");
              showRequestModalToggle();
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
  );
};

export default GameList;
