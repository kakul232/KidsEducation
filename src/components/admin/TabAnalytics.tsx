import React, { useState, useEffect } from "react";
import type { ActivityLog } from "../../services/db";

interface TabAnalyticsProps {
  logs: ActivityLog[];
}

export const TabAnalytics: React.FC<TabAnalyticsProps> = ({ logs }) => {
  const [visibleLogCount, setVisibleLogCount] = useState(20);
  const [selectedDetailLog, setSelectedDetailLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    setVisibleLogCount(20);
  }, [logs]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 120
      ) {
        setVisibleLogCount(prev => prev + 20);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
                  <tr key={log.id}>
                    <td className="student-name">{log.studentName}</td>
                    <td>{log.gameTitle}</td>
                    <td>{log.duration}s</td>
                    <td>{log.attempts}</td>
                    <td className="reward">{log.rewardEarned}</td>
                    <td className="device-info">
                      {log.deviceType ? `${log.deviceType} (${log.browser})` : `${log.device} (${log.browser})`}
                    </td>
                    <td className="device-info">{log.ip || "N/A"}</td>
                    <td>
                      {log.attemptsHistory && log.attemptsHistory.length > 0 ? (
                        <button
                          onClick={() => setSelectedDetailLog(log)}
                          className="btn analytics-view-attempts-btn"
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
              <div key={log.id} className="play-card admin-mobile-card">
                <div className="mobile-card-header">
                  <strong>{log.studentName}</strong>
                  <span className="reward">{log.rewardEarned}</span>
                </div>
                
                <div className="mobile-card-info">
                  <div><strong>Activity:</strong> <span>{log.gameTitle}</span></div>
                  <div><strong>Duration:</strong> {log.duration}s | <strong>Attempts:</strong> {log.attempts}</div>
                  <div><strong>Device:</strong> {log.deviceType ? `${log.deviceType} (${log.browser})` : `${log.device} (${log.browser})`}</div>
                  <div><strong>IP:</strong> {log.ip || "N/A"}</div>
                </div>

                {log.attemptsHistory && log.attemptsHistory.length > 0 ? (
                  <button
                    onClick={() => setSelectedDetailLog(log)}
                    className="btn btn-primary mobile-card-view-btn"
                  >
                    🔍 View Attempts ({log.attemptsHistory.length})
                  </button>
                ) : (
                  <span className="mobile-card-no-attempts">
                    No attempts recorded
                  </span>
                )}
              </div>
            ))}
          </div>

          {logs.length > visibleLogCount && (
            <div className="analytics-scroll-loading">
              ⏳ Scroll down to load more activity logs...
            </div>
          )}
        </>
      )}

      {/* Action History Breakdown Modal */}
      {selectedDetailLog && (
        <div className="admin-modal-overlay">
          <div className="play-card admin-detail-modal">
            <div className="detail-modal-header">
              <h3>📋 Attempt History Details</h3>
              <button
                onClick={() => setSelectedDetailLog(null)}
                className="detail-modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="detail-modal-body">
              <p><strong>Student:</strong> {selectedDetailLog.studentName}</p>
              <p><strong>Activity:</strong> {selectedDetailLog.gameTitle}</p>
              <p><strong>Device ID:</strong> <span className="monospace">{selectedDetailLog.deviceId || "N/A"}</span></p>
              <p><strong>User Agent:</strong> <span className="user-agent">{selectedDetailLog.userAgent || "Unknown"}</span></p>
            </div>

            <div className="detail-attempts-container">
              {selectedDetailLog.attemptsHistory?.map((attempt, index) => {
                const isSuccess = attempt.success;
                return (
                  <div key={index} className={`attempt-card ${isSuccess ? "success" : "failure"}`}>
                    <div className="attempt-card-text">
                      <span className="question">Q{index + 1}: {attempt.question}</span>
                      <span className="answer">Answered: <strong>{attempt.answer}</strong></span>
                    </div>
                    <span className={`attempt-badge ${isSuccess ? "success" : "failure"}`}>
                      {isSuccess ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedDetailLog(null)}
              className="btn btn-primary detail-modal-close-btn"
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
