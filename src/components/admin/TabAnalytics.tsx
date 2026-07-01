import React from "react";
import type { ActivityLog } from "../../services/db";

interface TabAnalyticsProps {
  logs: ActivityLog[];
  visibleLogCount: number;
  selectedDetailLog: ActivityLog | null;
  setSelectedDetailLog: (log: ActivityLog | null) => void;
}

export const TabAnalytics: React.FC<TabAnalyticsProps> = ({
  logs,
  visibleLogCount,
  selectedDetailLog,
  setSelectedDetailLog
}) => {
  return (
    <div className="play-card">
      <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Activity Analytics Log</h3>
      {logs.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No student logs recorded yet.</p>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr style={{ borderBottom: "2px solid #cbd5e1", textAlign: "left" }}>
                  <th>Student</th>
                  <th>Game</th>
                  <th>Duration</th>
                  <th>Attempts</th>
                  <th>Reward</th>
                  <th>Device Info</th>
                  <th>IP Address</th>
                  <th>Attempts History</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, visibleLogCount).map(log => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ fontWeight: "700" }}>{log.studentName}</td>
                    <td>{log.gameTitle}</td>
                    <td>{log.duration}s</td>
                    <td>{log.attempts}</td>
                    <td style={{ color: "var(--success)", fontWeight: "700" }}>{log.rewardEarned}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                      {log.deviceType ? `${log.deviceType} (${log.browser})` : `${log.device} (${log.browser})`}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{log.ip || "N/A"}</td>
                    <td>
                      {log.attemptsHistory && log.attemptsHistory.length > 0 ? (
                        <button
                          onClick={() => setSelectedDetailLog(log)}
                          className="btn"
                          style={{
                            padding: "4px 10px",
                            backgroundColor: "var(--accent-primary)",
                            color: "#ffffff",
                            fontSize: "0.75rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            boxShadow: "none"
                          }}
                        >
                          🔍 View Attempts ({log.attemptsHistory.length})
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-mobile-cards">
            {logs.slice(0, visibleLogCount).map(log => (
              <div
                key={log.id}
                className="play-card"
                style={{
                  padding: "16px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "var(--bg-primary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  borderRadius: "12px",
                  marginBottom: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "1rem" }}>{log.studentName}</strong>
                  <span style={{ color: "var(--success)", fontWeight: "800", fontSize: "0.85rem" }}>{log.rewardEarned}</span>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <div><strong>Activity:</strong> <span style={{ color: "var(--text-primary)" }}>{log.gameTitle}</span></div>
                  <div><strong>Duration:</strong> {log.duration}s | <strong>Attempts:</strong> {log.attempts}</div>
                  <div><strong>Device:</strong> {log.deviceType ? `${log.deviceType} (${log.browser})` : `${log.device} (${log.browser})`}</div>
                  <div><strong>IP:</strong> {log.ip || "N/A"}</div>
                </div>

                {log.attemptsHistory && log.attemptsHistory.length > 0 ? (
                  <button
                    onClick={() => setSelectedDetailLog(log)}
                    className="btn btn-primary"
                    style={{
                      padding: "8px 12px",
                      width: "100%",
                      fontSize: "0.75rem",
                      marginTop: "6px",
                      borderRadius: "8px",
                      boxShadow: "none"
                    }}
                  >
                    🔍 View Attempts ({log.attemptsHistory.length})
                  </button>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center", display: "block", marginTop: "6px" }}>
                    No attempts recorded
                  </span>
                )}
              </div>
            ))}
          </div>

          {logs.length > visibleLogCount && (
            <div style={{ textAlign: "center", padding: "16px", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: "700" }}>
              ⏳ Scroll down to load more activity logs...
            </div>
          )}
        </>
      )}

      {/* Action History Breakdown Modal */}
      {selectedDetailLog && (
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
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            className="play-card"
            style={{
              maxWidth: "500px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #cbd5e1", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "900", margin: 0 }}>
                📋 Attempt History Details
              </h3>
              <button
                onClick={() => setSelectedDetailLog(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  fontWeight: "900",
                  color: "var(--text-secondary)"
                }}
              >
                ×
              </button>
            </div>
            
            <div>
              <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>Student:</strong> {selectedDetailLog.studentName}</p>
              <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>Activity:</strong> {selectedDetailLog.gameTitle}</p>
              <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>Device ID:</strong> <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{selectedDetailLog.deviceId || "N/A"}</span></p>
              <p style={{ margin: "2px 0", fontSize: "0.9rem" }}><strong>User Agent:</strong> <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{selectedDetailLog.userAgent || "Unknown"}</span></p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {selectedDetailLog.attemptsHistory?.map((attempt, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1.5px solid",
                    borderColor: attempt.success ? "#86efac" : "#fca5a5",
                    backgroundColor: attempt.success ? "#f0fdf4" : "#fff5f5",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, paddingRight: "10px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                      Q{index + 1}: {attempt.question}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      Answered: <strong style={{ color: "var(--text-primary)" }}>{attempt.answer}</strong>
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: attempt.success ? "#065f46" : "#b91c1c",
                      backgroundColor: attempt.success ? "#d1fae5" : "#fee2e2"
                    }}
                  >
                    {attempt.success ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDetailLog(null)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "10px", marginTop: "10px" }}
            >
              Close History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabAnalytics;
