import React from "react";
import { Unlock, Lock, Eye, EyeOff, Edit2, Trash2 } from "lucide-react";
import LocalDB from "../../services/db";
import type { Game } from "../../services/db";
import { useApp } from "../../context/AppContext";

interface TabAllGamesProps {
  games: Game[];
  onEditGame: (game: Game) => void;
  onRefresh: () => void;
}

export const TabAllGames: React.FC<TabAllGamesProps> = ({
  games,
  onEditGame,
  onRefresh
}) => {
  const { sendPushNotification } = useApp();

  const handleSaveGameOrder = async (gameId: string, orderVal: number) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      const updated = {
        ...game,
        order: isNaN(orderVal) ? 0 : orderVal
      };
      await LocalDB.saveGame(updated);
      onRefresh();
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
      onRefresh();
    } catch (err: any) {
      console.error("Failed to save game star requirement:", err);
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
      onRefresh();
    } catch (err: any) {
      console.error("Failed to toggle game tier:", err);
      alert("Error updating game tier.");
    }
  };

  const handleTogglePublish = async (game: Game) => {
    const updated = {
      ...game,
      published: !game.published
    };
    try {
      await LocalDB.saveGame(updated);
      onRefresh();

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
      onRefresh();
    }
  };

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
                  <span className={`game-badge ${game.published ? "published" : "draft"}`}>
                    {game.published ? "Published" : "Draft / Hidden"}
                  </span>
                  <span className={`game-badge ${game.isFree !== false ? "free" : "premium"}`}>
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
                      className="admin-game-number-input order"
                    />
                  </div>
                  <span>•</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span>Min Stars:</span>
                    <input
                      type="number"
                      defaultValue={game.starsRequired || 0}
                      onBlur={(e) => handleSaveGameStarsRequired(game.id, parseInt(e.target.value))}
                      className="admin-game-number-input stars"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-game-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
                <button
                  onClick={() => handleToggleGameTier(game)}
                  className={`btn admin-game-action-btn ${game.isFree !== false ? "free" : "premium"}`}
                  title={game.isFree !== false ? "Make Paid/Premium" : "Make Free"}
                >
                  {game.isFree !== false ? <Unlock size={18} /> : <Lock size={18} />}
                </button>

                <button
                  onClick={() => handleTogglePublish(game)}
                  className={`btn admin-game-action-btn ${game.published ? "published" : "draft"}`}
                  title={game.published ? "Unpublish Activity" : "Publish Activity"}
                >
                  {game.published ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                <button
                  onClick={() => onEditGame(game)}
                  className="btn admin-game-action-btn edit"
                  title="Edit game details & code"
                >
                  <Edit2 size={18} />
                </button>

                <button
                  onClick={() => handleDeleteGame(game.id)}
                  className="btn admin-game-action-btn delete"
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
