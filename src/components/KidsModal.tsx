import React, { useEffect } from "react";
import PlayCard from "./PlayCard";

interface KidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  borderColor?: string; // fallback if border is not specified
  border?: string;
  backgroundColor?: string;
  backdropColor?: string;
  backdropFilter?: string;
  zIndex?: number;
  padding?: string;
  textAlign?: "center" | "left" | "right" | "inherit";
  gap?: string;
  style?: React.CSSProperties;
}

export const KidsModal: React.FC<KidsModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "360px",
  border,
  borderColor = "var(--accent-primary)",
  backgroundColor = "var(--bg-secondary)",
  backdropColor = "rgba(15, 23, 42, 0.4)",
  backdropFilter = "blur(5px)",
  zIndex = 10000,
  padding = "28px 24px",
  textAlign = "center",
  gap = "20px",
  style = {}
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backdropColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndex,
        padding: "20px",
        backdropFilter: backdropFilter
      }}
    >
      <PlayCard
        onClick={undefined} // static card wrapper
        className="animate-pop-in"
        style={{
          maxWidth: maxWidth,
          width: "100%",
          padding: padding,
          textAlign: textAlign,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: gap,
          backgroundColor: backgroundColor,
          border: border || `4px solid ${borderColor}`,
          borderRadius: "24px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          ...style
        }}
        // Stop click propagation so clicking inside the modal content doesn't trigger onClose
        {...({
          onClick: (e: React.MouseEvent) => e.stopPropagation()
        } as any)}
      >
        {children}
      </PlayCard>
    </div>
  );
};

export default KidsModal;
