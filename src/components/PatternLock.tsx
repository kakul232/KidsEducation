import React, { useState, useRef, useEffect } from "react";

interface PatternLockProps {
  mode: "set" | "verify";
  targetPattern?: string;
  onSuccess: (pattern: string) => void;
  onCancel?: () => void;
  onForgot?: () => void;
  title?: string;
  errorMessage?: string;
}

import { DOT_COORDS, COLLISION_RADIUS } from "../utils/constants";


export const PatternLock: React.FC<PatternLockProps> = ({
  mode,
  targetPattern,
  onSuccess,
  onCancel,
  onForgot,
  title,
  errorMessage: externalError
}) => {
  const [activeNodes, setActiveNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [firstPattern, setFirstPattern] = useState<string | null>(null); // For "set" mode double-check
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const getRelativeCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale pointer coordinate if container size is different from 300px
    const x = ((clientX - rect.left) / rect.width) * 300;
    const y = ((clientY - rect.top) / rect.height) * 300;

    return { x, y };
  };

  const checkDotCollision = (x: number, y: number) => {
    for (let i = 0; i < DOT_COORDS.length; i++) {
      const dot = DOT_COORDS[i];
      const dist = Math.hypot(x - dot.x, y - dot.y);
      if (dist < COLLISION_RADIUS) {
        return i;
      }
    }
    return null;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Avoid double activation
    setError("");
    setSuccessMsg("");
    const coords = getRelativeCoords(e);
    if (!coords) return;

    const hit = checkDotCollision(coords.x, coords.y);
    setIsDrawing(true);
    if (hit !== null) {
      setActiveNodes([hit]);
      setCurrentPos(DOT_COORDS[hit]);
    } else {
      setActiveNodes([]);
      setCurrentPos(coords);
    }
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    const coords = getRelativeCoords(e);
    if (!coords) return;

    setCurrentPos(coords);
    const hit = checkDotCollision(coords.x, coords.y);
    if (hit !== null && !activeNodes.includes(hit)) {
      setActiveNodes(prev => [...prev, hit]);
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPos(null);

    if (activeNodes.length < 3) {
      setError("Please connect at least 3 dots! 🔗");
      setActiveNodes([]);
      return;
    }

    const patternString = activeNodes.join("-");

    if (mode === "set") {
      if (!firstPattern) {
        // First pattern drawn, ask to confirm
        setFirstPattern(patternString);
        setSuccessMsg("Draw again to confirm your pattern! 👍");
        setActiveNodes([]);
      } else {
        // Compare with first
        if (patternString === firstPattern) {
          setSuccessMsg("Pattern Saved successfully! 🎉");
          onSuccess(patternString);
        } else {
          setError("Patterns do not match. Let's try again! 🔄");
          setFirstPattern(null);
          setActiveNodes([]);
        }
      }
    } else {
      // Verify mode
      if (targetPattern && patternString === targetPattern) {
        setSuccessMsg("Success! Logging you in...");
        onSuccess(patternString);
      } else {
        setError("Oops! That's not the correct pattern. Try again! 🤫");
        setActiveNodes([]);
      }
    }
  };

  // Attach window event listeners for smooth touch/drag outside of container
  useEffect(() => {
    const onGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isDrawing) {
        // Prevent default scrolling on mobile while drawing pattern
        if (e.cancelable) e.preventDefault();
        handleMove(e);
      }
    };

    const onGlobalEnd = () => {
      if (isDrawing) {
        handleEnd();
      }
    };

    window.addEventListener("mousemove", onGlobalMove, { passive: false });
    window.addEventListener("mouseup", onGlobalEnd);
    window.addEventListener("touchmove", onGlobalMove, { passive: false });
    window.addEventListener("touchend", onGlobalEnd);

    return () => {
      window.removeEventListener("mousemove", onGlobalMove);
      window.removeEventListener("mouseup", onGlobalEnd);
      window.removeEventListener("touchmove", onGlobalMove);
      window.removeEventListener("touchend", onGlobalEnd);
    };
  }, [isDrawing, activeNodes, firstPattern]);

  const resetPattern = () => {
    setActiveNodes([]);
    setFirstPattern(null);
    setError("");
    setSuccessMsg("");
  };

  const defaultTitle = mode === "set"
    ? (firstPattern ? "Confirm Pattern Lock" : "Create Pattern Lock")
    : "Enter Pattern Lock";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "100%", maxWidth: "340px", margin: "0 auto" }}>
      <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)", textAlign: "center" }}>
        {title || defaultTitle}
      </h3>

      {mode === "set" && !firstPattern && (
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", marginTop: "-10px" }}>
          (Connect 3 or more dots to lock your profile)
        </span>
      )}

      {/* SVG Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{
          width: "280px",
          height: "280px",
          backgroundColor: "#f8fafc",
          border: "4px solid #e2e8f0",
          borderRadius: "24px",
          boxShadow: "inset 0 4px 10px rgba(0,0,0,0.05), 0 10px 25px rgba(0,0,0,0.03)",
          position: "relative",
          cursor: "pointer",
          touchAction: "none",
          userSelect: "none"
        }}
      >
        <svg
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none"
          }}
          viewBox="0 0 300 300"
        >
          {/* Active connecting lines */}
          {activeNodes.length > 0 && (
            <path
              d={activeNodes.map((nodeIndex, idx) => {
                const coord = DOT_COORDS[nodeIndex];
                return `${idx === 0 ? "M" : "L"} ${coord.x} ${coord.y}`;
              }).join(" ")}
              fill="none"
              stroke="var(--accent-secondary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.8, filter: "drop-shadow(0 2px 8px rgba(14, 165, 233, 0.4))" }}
            />
          )}

          {/* Current dragging line */}
          {isDrawing && activeNodes.length > 0 && currentPos && (
            <line
              x1={DOT_COORDS[activeNodes[activeNodes.length - 1]].x}
              y1={DOT_COORDS[activeNodes[activeNodes.length - 1]].y}
              x2={currentPos.x}
              y2={currentPos.y}
              stroke="var(--accent-secondary)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="4 4"
              style={{ opacity: 0.6 }}
            />
          )}

          {/* Render the 3x3 dots */}
          {DOT_COORDS.map((coord, idx) => {
            const isActive = activeNodes.includes(idx);
            return (
              <g key={idx}>
                {/* Pulsing outer glow for active dots */}
                {isActive && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="24"
                    fill="var(--accent-secondary)"
                    style={{ opacity: 0.15, transformOrigin: `${coord.x}px ${coord.y}px`, animation: "ping 1.5s infinite" }}
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="16"
                  fill="transparent"
                  stroke={isActive ? "var(--accent-secondary)" : "#cbd5e1"}
                  strokeWidth="3"
                  style={{ transition: "all 0.2s" }}
                />

                {/* Inner dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isActive ? "10" : "6"}
                  fill={isActive ? "var(--accent-secondary)" : "#94a3b8"}
                  style={{ transition: "all 0.2s" }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Message and actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", minHeight: "85px", justifyContent: "center", alignItems: "center" }}>
        {error && (
          <span style={{ color: "var(--accent-primary)", fontWeight: "700", fontSize: "0.9rem", textAlign: "center", animation: "shake 0.3s" }}>
            ⚠️ {error}
          </span>
        )}

        {successMsg && (
          <span style={{ color: "var(--success)", fontWeight: "700", fontSize: "0.9rem", textAlign: "center" }}>
            ✨ {successMsg}
          </span>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginTop: "4px" }}>
          <button
            type="button"
            onClick={resetPattern}
            className="btn"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              backgroundColor: "#f1f5f9",
              border: "1.5px solid #cbd5e1",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Clear Drawing
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn"
              style={{
                padding: "6px 12px",
                fontSize: "0.8rem",
                backgroundColor: "#fff",
                border: "1.5px solid #cbd5e1",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {mode === "verify" && onForgot && (
          <button
            type="button"
            onClick={onForgot}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-secondary)",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              textDecoration: "underline",
              marginTop: "4px"
            }}
          >
            Forgot it? (Ask Frog uncle to reset it)
          </button>
        )}
      </div>
    </div>
  );
};
