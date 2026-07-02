import React, { useEffect, useRef } from "react";
import PlayCard from "./PlayCard";

interface KidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  borderColor?: string;
  border?: string;
  backgroundColor?: string;
  backdropColor?: string;
  backdropFilter?: string;
  zIndex?: number;
  padding?: string;
  textAlign?: "center" | "left" | "right" | "inherit";
  gap?: string;
  style?: React.CSSProperties;
  className?: string;
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
  style = {},
  className = ""
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. Freeze the background scroll
      document.body.style.overflow = "hidden";
      // 2. Break the viewport-flex constraint while modal is active
      document.body.style.height = "100vh";

      // 3. Autofocus the first interactive element (like buttons) for keyboard scroll focus
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);
    } else {
      // Clean back up when closed
      document.body.style.overflow = "";
      document.body.style.height = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backdropColor,
        justifyContent: "center",
        display: "grid",
        // placeItems: "center", // perfectly centers vertically and horizontally
        zIndex: zIndex,
        padding: "40px 24px",
        backdropFilter: backdropFilter,
        outline: "none"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: maxWidth,
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <PlayCard
          className={`animate-pop-in ${className}`}
          style={{
            width: "100%",
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
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
        >
          {children}
        </PlayCard>
      </div>
    </div>
  );
};

export default KidsModal;