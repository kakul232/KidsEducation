import React from "react";
import { Unlock, Lock, Eye, EyeOff, Edit2, Trash2 } from "lucide-react";
import type { Game } from "../../services/db";

interface TabAllGamesProps {
  games: Game[];
  handleSaveGameOrder: (id: string, order: number) => void;
  handleSaveGameStarsRequired: (id: string, stars: number) => void;
  handleToggleGameTier: (game: Game) => void;
  handleTogglePublish: (game: Game) => void;
  handleEditGame: (game: Game) => void;
  handleDeleteGame: (id: string) => void;
}

export const TabAllGames: React.FC<TabAllGamesProps> = ({
  games,
  handleSaveGameOrder,
  handleSaveGameStarsRequired,
  handleToggleGameTier,
  handleTogglePublish,
  handleEditGame,
  handleDeleteGame
}) => {
  return (
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
  );
};

export default TabAllGames;
