import React from "react";
import type { Student } from "../../services/db";
import { PlayCard } from "../PlayCard";
import { AvatarIcon } from "../AvatarIcon";
import { StarBadge } from "../StarBadge";
import { StreakBadge } from "../StreakBadge";

interface StudentHeaderProps {
  currentStudent: Student | null;
  isPremium: (student: Student | null) => boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({ currentStudent, isPremium }) => {
  return (
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Student Account</span>
            <span
              style={{
                fontSize: "0.75rem",
                backgroundColor: isPremium(currentStudent) ? "#e0f2fe" : "#f1f5f9",
                color: isPremium(currentStudent) ? "#0369a1" : "#475569",
                padding: "2px 8px",
                borderRadius: "8px",
                fontWeight: "900",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                border: isPremium(currentStudent) ? "1.5px solid #bae6fd" : "1.5px solid #cbd5e1"
              }}
            >
              {isPremium(currentStudent) ? "💎 Premium" : "🆓 Free"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <StarBadge count={currentStudent?.stars || 0} />
        <StreakBadge days={currentStudent?.streak || 1} />
      </div>
    </PlayCard>
  );
};

export default StudentHeader;
