import React from "react";
import type { Student } from "../../services/db";
import { PatternLock } from "../PatternLock";

interface TabOverviewProps {
  students: Student[];
  gamesCount: number;
  logsCount: number;
  groupByPhone: boolean;
  setGroupByPhone: (val: boolean) => void;
  selectedStudentIds: string[];
  setSelectedStudentIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleBulkPremiumStudents: () => void;
  handleBulkFreeStudents: () => void;
  handleBulkDeleteStudents: () => void;
  handleToggleSelectStudent: (id: string) => void;
  handleToggleStudentTier: (std: Student) => void;
  patternModalStudent: Student | null;
  setPatternModalStudent: (std: Student | null) => void;
  handleSaveStudentPattern: (pattern: string) => void;
  handleExtendValidity: (id: string) => void;
}

export const TabOverview: React.FC<TabOverviewProps> = ({
  students,
  gamesCount,
  logsCount,
  groupByPhone,
  setGroupByPhone,
  selectedStudentIds,
  setSelectedStudentIds,
  handleBulkPremiumStudents,
  handleBulkFreeStudents,
  handleBulkDeleteStudents,
  handleToggleSelectStudent,
  handleToggleStudentTier,
  patternModalStudent,
  setPatternModalStudent,
  handleSaveStudentPattern,
  handleExtendValidity
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="admin-stats-grid">
        <div className="play-card" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-primary)" }}>
            {students.length}
          </span>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Registered Students
          </p>
        </div>
        <div className="play-card" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-secondary)" }}>
            {gamesCount}
          </span>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Total Game Activities
          </p>
        </div>
        <div className="play-card" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--success)" }}>
            {logsCount}
          </span>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Plays Completed
          </p>
        </div>
      </div>

      {/* Students List */}
      <div className="play-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Active Students ({students.length})</h3>
            <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
              <button
                onClick={() => setGroupByPhone(false)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: !groupByPhone ? "#fff" : "transparent",
                  color: !groupByPhone ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: !groupByPhone ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                📋 Flat List
              </button>
              <button
                onClick={() => setGroupByPhone(true)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: groupByPhone ? "#fff" : "transparent",
                  color: groupByPhone ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: groupByPhone ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                📞 Group by Phone
              </button>
            </div>
          </div>
          {selectedStudentIds.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={handleBulkPremiumStudents}
                className="btn btn-success"
                style={{
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  borderRadius: "10px",
                  boxShadow: "none",
                  cursor: "pointer"
                }}
              >
                💎 Make Premium ({selectedStudentIds.length})
              </button>
              <button
                onClick={handleBulkFreeStudents}
                className="btn"
                style={{
                  padding: "8px 14px",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  borderRadius: "10px",
                  boxShadow: "none",
                  backgroundColor: "#f1f5f9",
                  border: "1.5px solid #cbd5e1",
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                🆓 Make Free ({selectedStudentIds.length})
              </button>
              <button
                onClick={handleBulkDeleteStudents}
                className="btn"
                style={{
                  padding: "8px 14px",
                  backgroundColor: "#fee2e2",
                  border: "1.5px solid #ef4444",
                  color: "#b91c1c",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  boxShadow: "none",
                  cursor: "pointer"
                }}
              >
                🗑️ Delete ({selectedStudentIds.length})
              </button>
            </div>
          )}
        </div>
        {students.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>No students registered yet.</p>
        ) : groupByPhone ? (
          (() => {
            const groups: { [phone: string]: Student[] } = {};
            students.forEach(std => {
              const rawPhone = std.phone?.trim();
              const phoneKey = rawPhone || "No Phone Number";
              if (!groups[phoneKey]) {
                groups[phoneKey] = [];
              }
              groups[phoneKey].push(std);
            });

            const sortedPhoneKeys = Object.keys(groups).sort((a, b) => {
              if (a === "No Phone Number") return 1;
              if (b === "No Phone Number") return -1;
              return a.localeCompare(b);
            });

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {sortedPhoneKeys.map(phoneKey => {
                  const groupStudents = groups[phoneKey];
                  const isGroupAllSelected = groupStudents.every(s => selectedStudentIds.includes(s.id));
                  const handleToggleGroup = () => {
                    if (isGroupAllSelected) {
                      const idsToRemove = groupStudents.map(s => s.id);
                      setSelectedStudentIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                    } else {
                      const idsToAdd = groupStudents.map(s => s.id).filter(id => !selectedStudentIds.includes(id));
                      setSelectedStudentIds(prev => [...prev, ...idsToAdd]);
                    }
                  };

                  return (
                    <div
                      key={phoneKey}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "16px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: "1.5px solid #cbd5e1",
                          paddingBottom: "10px",
                          marginBottom: "4px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={isGroupAllSelected}
                            onChange={handleToggleGroup}
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              accentColor: "var(--accent-primary)",
                              cursor: "pointer"
                            }}
                          />
                          <span style={{ fontWeight: "800", fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                            {phoneKey === "No Phone Number" ? "❔" : "📞"} {phoneKey}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: "var(--accent-primary)",
                            color: "#fff",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontWeight: "800"
                          }}
                        >
                          {groupStudents.length} {groupStudents.length === 1 ? "Student" : "Students"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {groupStudents.map(std => {
                          const isExpired = std.validUntil && new Date() > new Date(std.validUntil);
                          return (
                            <div
                              key={std.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px 16px",
                                backgroundColor: "#fff",
                                borderRadius: "12px",
                                border: "1.5px solid",
                                borderColor: selectedStudentIds.includes(std.id) ? "var(--accent-primary)" : "#cbd5e1"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(std.id)}
                                  onChange={() => handleToggleSelectStudent(std.id)}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    accentColor: "var(--accent-primary)",
                                    cursor: "pointer"
                                  }}
                                />
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                                    <span style={{ fontWeight: "700", fontSize: "1rem" }}>{std.name}</span>
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        backgroundColor: std.tier === "paid" ? "#fee2e2" : "#f1f5f9",
                                        color: std.tier === "paid" ? "#991b1b" : "#475569",
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        fontWeight: "800"
                                      }}
                                    >
                                      {std.tier === "paid" ? "💎 Premium" : "🆓 Free"}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                    Age: {std.age || "N/A"} | Class: {std.class || "N/A"} | Pattern: {std.patternLock ? "🔒 Set" : "🔓 Not Set"}
                                  </span>
                                  <span style={{ fontSize: "0.8rem", color: isExpired ? "#ef4444" : "#10b981", fontWeight: "800" }}>
                                    {isExpired ? "⏰ Expired" : "✓ Active"} (Expires: {std.validUntil ? new Date(std.validUntil).toLocaleDateString() : "Never"})
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ color: "#c2410c", fontWeight: "800", fontSize: "0.95rem" }}>⭐ {std.stars} Stars</span>
                                <button
                                  onClick={() => handleToggleStudentTier(std)}
                                  className="btn"
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "0.75rem",
                                    boxShadow: "none",
                                    backgroundColor: std.tier === "paid" ? "#f1f5f9" : "#fee2e2",
                                    border: std.tier === "paid" ? "1.5px solid #cbd5e1" : "1.5px solid #ef4444",
                                    color: std.tier === "paid" ? "#475569" : "#b91c1c",
                                    fontWeight: "800",
                                    cursor: "pointer"
                                  }}
                                >
                                  {std.tier === "paid" ? "🆓 Make Free" : "💎 Make Premium"}
                                </button>
                                <button
                                  onClick={() => setPatternModalStudent(std)}
                                  className="btn"
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: "0.75rem",
                                    boxShadow: "none",
                                    backgroundColor: "#e0f2fe",
                                    border: "1.5px solid #0284c7",
                                    color: "#0369a1",
                                    fontWeight: "800",
                                    cursor: "pointer"
                                  }}
                                >
                                  🔑 Pattern
                                </button>
                                <button
                                  onClick={() => handleExtendValidity(std.id)}
                                  className="btn btn-success"
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "0.75rem",
                                    boxShadow: "none",
                                    backgroundColor: "#d1fae5",
                                    border: "1.5px solid #10b981",
                                    color: "#065f46"
                                  }}
                                >
                                  ➕ Renew +1 Mo
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {students.map(std => {
              const isExpired = std.validUntil && new Date() > new Date(std.validUntil);
              return (
                <div
                  key={std.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: "var(--bg-primary)",
                    borderRadius: "12px",
                    border: "1.5px solid",
                    borderColor: selectedStudentIds.includes(std.id) ? "var(--accent-primary)" : "#cbd5e1"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(std.id)}
                      onChange={() => handleToggleSelectStudent(std.id)}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        accentColor: "var(--accent-primary)",
                        cursor: "pointer"
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <span style={{ fontWeight: "700", fontSize: "1rem" }}>{std.name}</span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: std.tier === "paid" ? "#fee2e2" : "#f1f5f9",
                            color: std.tier === "paid" ? "#991b1b" : "#475569",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontWeight: "800"
                          }}
                        >
                          {std.tier === "paid" ? "💎 Premium" : "🆓 Free"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Age: {std.age || "N/A"} | Class: {std.class || "N/A"} | Phone: {std.phone || "N/A"} | Pattern: {std.patternLock ? "🔒 Set" : "🔓 Not Set"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: isExpired ? "#ef4444" : "#10b981", fontWeight: "800" }}>
                        {isExpired ? "⏰ Expired" : "✓ Active"} (Expires: {std.validUntil ? new Date(std.validUntil).toLocaleDateString() : "Never"})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ color: "#c2410c", fontWeight: "800", fontSize: "0.95rem" }}>⭐ {std.stars} Stars</span>
                    <button
                      onClick={() => handleToggleStudentTier(std)}
                      className="btn"
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.75rem",
                        boxShadow: "none",
                        backgroundColor: std.tier === "paid" ? "#f1f5f9" : "#fee2e2",
                        border: std.tier === "paid" ? "1.5px solid #cbd5e1" : "1.5px solid #ef4444",
                        color: std.tier === "paid" ? "#475569" : "#b91c1c",
                        fontWeight: "800",
                        cursor: "pointer"
                      }}
                    >
                      {std.tier === "paid" ? "🆓 Make Free" : "💎 Make Premium"}
                    </button>
                    <button
                      onClick={() => setPatternModalStudent(std)}
                      className="btn"
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.75rem",
                        boxShadow: "none",
                        backgroundColor: "#e0f2fe",
                        border: "1.5px solid #0284c7",
                        color: "#0369a1",
                        fontWeight: "800",
                        cursor: "pointer"
                      }}
                    >
                      🔑 Pattern
                    </button>
                    <button
                      onClick={() => handleExtendValidity(std.id)}
                      className="btn btn-success"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        boxShadow: "none",
                        backgroundColor: "#d1fae5",
                        border: "1.5px solid #10b981",
                        color: "#065f46"
                      }}
                    >
                      ➕ Renew +1 Mo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pattern Reset Modal Overlay */}
      {patternModalStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10005,
            padding: "20px",
            backdropFilter: "blur(6px)"
          }}
        >
          <div className="play-card" style={{ maxWidth: "380px", width: "100%", textAlign: "center", padding: "24px" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>Set Pattern for {patternModalStudent.name}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Draw a pattern that this student will use to log in.
            </p>
            <PatternLock
              mode="set"
              onSuccess={handleSaveStudentPattern}
              onCancel={() => setPatternModalStudent(null)}
            />
            <button
              onClick={() => setPatternModalStudent(null)}
              className="btn btn-gray"
              style={{ width: "100%", padding: "12px", marginTop: "16px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabOverview;
