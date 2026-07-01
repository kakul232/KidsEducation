import React from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import type { GameRequest } from "../../services/db";

interface TabRequestsProps {
  gameRequests: GameRequest[];
  handleDeleteRequest: (id: string) => void;
}

export const TabRequests: React.FC<TabRequestsProps> = ({
  gameRequests,
  handleDeleteRequest
}) => {
  return (
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
  );
};

export default TabRequests;
