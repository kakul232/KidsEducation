import React from "react";
import { Star } from "lucide-react";

interface StarBadgeProps {
  count: number;
}

export const StarBadge: React.FC<StarBadgeProps> = ({ count }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#fef9c3",
        border: "2px solid #facc15",
        borderRadius: "14px",
        padding: "6px 14px",
        fontWeight: "800",
        color: "#854d0e"
      }}
    >
      <Star size={18} fill="#facc15" color="#eab308" />
      <span>{count}</span>
    </div>
  );
};
export default StarBadge;
