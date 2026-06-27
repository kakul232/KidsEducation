import React from "react";

interface PlayCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const PlayCard: React.FC<PlayCardProps> = ({ children, style, className = "", onClick }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`play-card ${className}`}
      style={{
        width: "100%",
        textAlign: onClick ? "left" : "inherit",
        border: onClick ? "3px solid #e2e8f0" : "2px solid rgba(0,0,0,0.03)",
        ...style
      }}
    >
      {children}
    </Tag>
  );
};
export default PlayCard;
