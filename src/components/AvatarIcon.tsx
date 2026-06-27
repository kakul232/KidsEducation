import React from "react";
import { AVATAR_EMOJIS } from "../utils/constants";

interface AvatarIconProps {
  avatarId: string;
  size?: "sm" | "md" | "lg";
}

export const AvatarIcon: React.FC<AvatarIconProps> = ({ avatarId, size = "md" }) => {
  const emoji = AVATAR_EMOJIS[avatarId] || "🧒";
  const sizeMap = {
    sm: "1.5rem",
    md: "2.5rem",
    lg: "3.5rem"
  };

  return (
    <span
      style={{
        fontSize: sizeMap[size],
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none"
      }}
      role="img"
      aria-label={`Avatar ${avatarId}`}
    >
      {emoji}
    </span>
  );
};
export default AvatarIcon;
