import React from "react";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  days: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ days }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#ffedd5",
        border: "2px solid #fb923c",
        borderRadius: "14px",
        padding: "6px 14px",
        fontWeight: "800",
        color: "#c2410c"
      }}
    >
      <Flame size={18} fill="#fb923c" color="#ea580c" />
      <span>{days}d</span>
    </div>
  );
};
export default StreakBadge;
