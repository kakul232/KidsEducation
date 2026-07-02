import React, { useState } from "react";
import LocalDB from "../../services/db";
import type { Student } from "../../services/db";
import { PatternLock } from "../PatternLock";

interface TabOverviewProps {
  students: Student[];
  gamesCount: number;
  logsCount: number;
  onRefresh: () => void;
}

export const TabOverview: React.FC<TabOverviewProps> = ({
  students,
  gamesCount,
  logsCount,
  onRefresh
}) => {
  const [groupByPhone, setGroupByPhone] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [patternModalStudent, setPatternModalStudent] = useState<Student | null>(null);

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleStudentTier = async (student: Student) => {
    try {
      const updated = {
        ...student,
        tier: student.tier === "paid" ? "free" : ("paid" as any)
      };
      await LocalDB.saveStudent(updated);
      alert(`Updated ${student.name}'s tier to ${updated.tier === "paid" ? "💎 Premium" : "🆓 Free"}`);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to toggle student tier:", err);
      alert("Error updating student tier.");
    }
  };

  const handleSaveStudentPattern = async (pattern: string) => {
    if (!patternModalStudent) return;
    try {
      const updated = {
        ...patternModalStudent,
        patternLock: pattern
      };
      await LocalDB.saveStudent(updated);
      alert(`Successfully set Pattern Lock for ${patternModalStudent.name}!`);
      setPatternModalStudent(null);
      onRefresh();
    } catch (e) {
      console.error("Failed to set student pattern lock:", e);
      alert("Failed to set pattern lock.");
    }
  };

  const handleExtendValidity = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const currentExp = student.validUntil ? new Date(student.validUntil) : new Date();
      const baseDate = currentExp > new Date() ? currentExp : new Date();
      const newExp = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const updatedStudent = {
        ...student,
        validUntil: newExp,
        lastActive: new Date().toISOString()
      };

      await LocalDB.saveStudent(updatedStudent);
      alert(`Extended validity for ${student.name} by +1 Month!\nNew Expiry: ${new Date(newExp).toLocaleDateString()}`);
      onRefresh();
    } catch (e) {
      console.error("Failed to extend validity:", e);
      alert("Error extending student validity.");
    }
  };

  const handleBulkPremiumStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    try {
      await Promise.all(selectedStudentIds.map(async (id) => {
        const student = students.find(s => s.id === id);
        if (student) {
          const updated = {
            ...student,
            tier: "paid" as const
          };
          await LocalDB.saveStudent(updated);
        }
      }));
      alert(`Successfully upgraded ${count} student(s) to Premium! 💎`);
      setSelectedStudentIds([]);
      onRefresh();
    } catch (err: any) {
      console.error("Bulk premium update failed:", err);
      alert("Failed to update selected students tier: " + err.message);
    }
  };

  const handleBulkFreeStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    try {
      await Promise.all(selectedStudentIds.map(async (id) => {
        const student = students.find(s => s.id === id);
        if (student) {
          const updated = {
            ...student,
            tier: "free" as const
          };
          await LocalDB.saveStudent(updated);
        }
      }));
      alert(`Successfully changed ${count} student(s) to Free tier! 🆓`);
      setSelectedStudentIds([]);
      onRefresh();
    } catch (err: any) {
      console.error("Bulk free update failed:", err);
      alert("Failed to update selected students tier: " + err.message);
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    if (confirm(`Are you sure you want to delete the selected ${count} student(s)? This will permanently remove their profile data.`)) {
      try {
        await Promise.all(selectedStudentIds.map(id => LocalDB.deleteStudent(id)));
        alert(`Successfully deleted ${count} student(s)!`);
        setSelectedStudentIds([]);
        onRefresh();
      } catch (err: any) {
        console.error("Bulk deletion failed:", err);
        alert("Failed to delete selected students: " + err.message);
      }
    }
  };

  return (
    <div className="admin-content-container">
      <div className="admin-stats-grid">
        <div className="play-card admin-stat-card">
          <span className="stat-primary">{students.length}</span>
          <p>Registered Students</p>
        </div>
        <div className="play-card admin-stat-card">
          <span className="stat-secondary">{gamesCount}</span>
          <p>Total Game Activities</p>
        </div>
        <div className="play-card admin-stat-card">
          <span className="stat-success">{logsCount}</span>
          <p>Plays Completed</p>
        </div>
      </div>

      {/* Students List */}
      <div className="play-card">
        <div className="admin-overview-header">
          <div className="admin-overview-actions">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Active Students ({students.length})</h3>
            <div className="admin-switcher-wrapper">
              <button
                onClick={() => setGroupByPhone(false)}
                className={`admin-switcher-btn ${!groupByPhone ? "active" : ""}`}
              >
                📋 Flat List
              </button>
              <button
                onClick={() => setGroupByPhone(true)}
                className={`admin-switcher-btn ${groupByPhone ? "active" : ""}`}
              >
                📞 Group by Phone
              </button>
            </div>
          </div>
          {selectedStudentIds.length > 0 && (
            <div className="admin-bulk-actions-wrapper">
              <button
                onClick={handleBulkPremiumStudents}
                className="btn btn-success admin-bulk-btn"
              >
                💎 Make Premium ({selectedStudentIds.length})
              </button>
              <button
                onClick={handleBulkFreeStudents}
                className="btn admin-bulk-btn"
                style={{ backgroundColor: "#f1f5f9", border: "1.5px solid #cbd5e1", color: "#475569" }}
              >
                🆓 Make Free ({selectedStudentIds.length})
              </button>
              <button
                onClick={handleBulkDeleteStudents}
                className="btn admin-bulk-btn"
                style={{ backgroundColor: "#fee2e2", border: "1.5px solid #ef4444", color: "#b91c1c" }}
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
                    <div key={phoneKey} className="admin-phone-group-card">
                      <div className="admin-phone-group-header">
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
                        <span className="admin-phone-group-count">
                          {groupStudents.length} {groupStudents.length === 1 ? "Student" : "Students"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {groupStudents.map(std => {
                          const isExpired = std.validUntil && new Date() > new Date(std.validUntil);
                          const isSelected = selectedStudentIds.includes(std.id);
                          return (
                            <div
                              key={std.id}
                              className={`admin-student-list-row ${isSelected ? "selected" : ""}`}
                              style={{ backgroundColor: "#fff" }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
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
                                    <span className={`student-tier-badge ${std.tier === "paid" ? "premium" : "free"}`}>
                                      {std.tier === "paid" ? "💎 Premium" : "🆓 Free"}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                    Age: {std.age || "N/A"} | Class: {std.class || "N/A"} | Pattern: {std.patternLock ? "🔒 Set" : "🔓 Not Set"}
                                  </span>
                                  <span className={`student-status-text ${isExpired ? "expired" : "active"}`}>
                                    {isExpired ? "⏰ Expired" : "✓ Active"} (Expires: {std.validUntil ? new Date(std.validUntil).toLocaleDateString() : "Never"})
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span className="student-stars-display">⭐ {std.stars} Stars</span>
                                <button
                                  onClick={() => handleToggleStudentTier(std)}
                                  className="btn student-action-btn-small"
                                  style={{
                                    backgroundColor: std.tier === "paid" ? "#f1f5f9" : "#fee2e2",
                                    border: std.tier === "paid" ? "1.5px solid #cbd5e1" : "1.5px solid #ef4444",
                                    color: std.tier === "paid" ? "#475569" : "#b91c1c"
                                  }}
                                >
                                  {std.tier === "paid" ? "🆓 Make Free" : "💎 Make Premium"}
                                </button>
                                <button
                                  onClick={() => setPatternModalStudent(std)}
                                  className="btn student-action-btn-small"
                                  style={{
                                    backgroundColor: "#e0f2fe",
                                    border: "1.5px solid #0284c7",
                                    color: "#0369a1"
                                  }}
                                >
                                  🔑 Pattern
                                </button>
                                <button
                                  onClick={() => handleExtendValidity(std.id)}
                                  className="btn btn-success student-action-btn-small"
                                  style={{
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
              const isSelected = selectedStudentIds.includes(std.id);
              return (
                <div
                  key={std.id}
                  className={`admin-student-list-row ${isSelected ? "selected" : ""}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
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
                        <span className={`student-tier-badge ${std.tier === "paid" ? "premium" : "free"}`}>
                          {std.tier === "paid" ? "💎 Premium" : "🆓 Free"}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Age: {std.age || "N/A"} | Class: {std.class || "N/A"} | Phone: {std.phone || "N/A"} | Pattern: {std.patternLock ? "🔒 Set" : "🔓 Not Set"}
                      </span>
                      <span className={`student-status-text ${isExpired ? "expired" : "active"}`}>
                        {isExpired ? "⏰ Expired" : "✓ Active"} (Expires: {std.validUntil ? new Date(std.validUntil).toLocaleDateString() : "Never"})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className="student-stars-display">⭐ {std.stars} Stars</span>
                    <button
                      onClick={() => handleToggleStudentTier(std)}
                      className="btn student-action-btn-small"
                      style={{
                        backgroundColor: std.tier === "paid" ? "#f1f5f9" : "#fee2e2",
                        border: std.tier === "paid" ? "1.5px solid #cbd5e1" : "1.5px solid #ef4444",
                        color: std.tier === "paid" ? "#475569" : "#b91c1c"
                      }}
                    >
                      {std.tier === "paid" ? "🆓 Make Free" : "💎 Make Premium"}
                    </button>
                    <button
                      onClick={() => setPatternModalStudent(std)}
                      className="btn student-action-btn-small"
                      style={{
                        backgroundColor: "#e0f2fe",
                        border: "1.5px solid #0284c7",
                        color: "#0369a1"
                      }}
                    >
                      🔑 Pattern
                    </button>
                    <button
                      onClick={() => handleExtendValidity(std.id)}
                      className="btn btn-success student-action-btn-small"
                      style={{
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
        <div className="admin-modal-overlay">
          <div className="play-card admin-pattern-reset-modal">
            <h3 style={{ margin: "0 0 10px 0" }}>Set Pattern for {patternModalStudent.name}</h3>
            <p className="admin-text-desc" style={{ marginBottom: "20px" }}>
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
