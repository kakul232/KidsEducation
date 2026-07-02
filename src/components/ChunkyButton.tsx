import React from "react";

interface ChunkyButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "gray";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const ChunkyButton: React.FC<ChunkyButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
  style,
  className = ""
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style
      }}
    >
      {children}
    </button>
  );
};
export default ChunkyButton;
