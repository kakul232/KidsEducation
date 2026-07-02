import React from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import LocalDB from "../../services/db";
import type { GameRequest } from "../../services/db";

interface TabRequestsProps {
  gameRequests: GameRequest[];
  onRefresh: () => void;
}

export const TabRequests: React.FC<TabRequestsProps> = ({
  gameRequests,
  onRefresh
}) => {
  const handleDeleteRequest = async (requestId: string) => {
    if (confirm("Are you sure you want to archive/delete this student request?")) {
      try {
        await LocalDB.deleteGameRequest(requestId);
        alert("Request archived successfully!");
        onRefresh();
      } catch (err: any) {
        console.error("Failed to archive request:", err);
        alert("Error archiving request.");
      }
    }
  };

  return (
    <div className="play-card">
      <div className="admin-requests-header">
        <h3 className="admin-requests-title">
          <Lightbulb size={20} color="var(--accent-primary)" />
          <span>Student Game Requests ({gameRequests.length})</span>
        </h3>
      </div>
      <p className="admin-requests-desc">
        Below are the game ideas and suggestions sent in by the students from their dashboards.
      </p>

      {gameRequests.length === 0 ? (
        <div className="admin-requests-empty">
          <Lightbulb size={48} color="#cbd5e1" className="admin-requests-empty-icon" />
          <p className="admin-requests-empty-text">
            No game suggestions submitted yet.
          </p>
        </div>
      ) : (
        <div className="admin-requests-grid">
          {gameRequests.map((req) => (
            <div key={req.id} className="play-card admin-request-card">
              <div>
                <div className="admin-request-card-header">
                  <div>
                    <span className="admin-request-student-name">
                      {req.studentName}
                    </span>
                    <span className="admin-request-time">
                      Submitted: {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="admin-request-text">
                  "{req.idea}"
                </p>
              </div>
              <button
                onClick={() => handleDeleteRequest(req.id)}
                className="btn admin-request-archive-btn"
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
