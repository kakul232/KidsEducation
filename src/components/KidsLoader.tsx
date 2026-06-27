import React, { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "🐸 Hopper the frog is jumping to get your game...",
  "🎨 Painting the canvas with beautiful colors...",
  "🎈 Blowing up shiny balloons for counting...",
  "✨ Adding a dash of magic math dust...",
  "💫 Gathering bright, happy stars...",
  "🦖 Prepping the code dinosaur for lift-off...",
  "🚀 Coding rocket is blasting into space...",
  "🍦 Scooping up some cool learning ice cream..."
];

// Helper to generate floating bubble metadata
const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: Math.floor(Math.random() * 40) + 20, // 20px to 60px
  left: `${Math.floor(Math.random() * 90) + 5}%`,
  delay: `${i * 0.7}s`,
  duration: `${Math.floor(Math.random() * 4) + 6}s`, // 6s to 10s
  color: ["#fecdd3", "#fef9c3", "#d1fae5", "#e0f2fe", "#f3e8ff", "#ffedd5"][i % 6]
}));

export const KidsLoader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [animateText, setAnimateText] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateText(false);
      setTimeout(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
        setAnimateText(true);
      }, 200); // Small delay to let text exit/enter
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(244, 247, 246, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        overflow: "hidden"
      }}
    >
      {/* Floating balloons/bubbles in the background */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
        {BUBBLES.map((bubble) => (
          <div
            key={bubble.id}
            className="animate-kids-float"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: bubble.left,
              backgroundColor: bubble.color,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
              borderRadius: "50%",
              boxShadow: "inset -4px -4px 10px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.05)",
              border: "1.5px solid rgba(255, 255, 255, 0.4)"
            }}
          />
        ))}
      </div>

      {/* Main loading card */}
      <div
        className="play-card animate-pop-in"
        style={{
          width: "90%",
          maxWidth: "420px",
          textAlign: "center",
          padding: "40px 24px",
          border: "4px solid var(--accent-primary)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.08)",
          borderRadius: "32px",
          zIndex: 10,
          position: "relative",
          backgroundColor: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px"
        }}
      >
        {/* Animated mascot container */}
        <div style={{ position: "relative", width: "130px", height: "130px" }}>
          {/* Sparkles rotating background */}
          <div
            className="animate-kids-spin-slow"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              opacity: 0.8
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
              <path d="M 50 10 L 53 38 L 80 25 L 58 45 L 90 50 L 58 55 L 80 75 L 53 62 L 50 90 L 47 62 L 20 75 L 42 55 L 10 50 L 42 45 L 20 25 L 47 38 Z" fill="#fef08a" opacity="0.8" />
            </svg>
          </div>

          {/* Hopper the Frog mascot */}
          <div
            className="animate-kids-bounce"
            style={{
              position: "absolute",
              width: "120px",
              height: "120px",
              top: "5px",
              left: "5px",
              zIndex: 2
            }}
          >
            <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
              {/* Legs */}
              <ellipse cx="28" cy="90" rx="14" ry="10" fill="#22c55e" stroke="#15803d" strokeWidth="4" />
              <ellipse cx="92" cy="90" rx="14" ry="10" fill="#22c55e" stroke="#15803d" strokeWidth="4" />
              {/* Body */}
              <ellipse cx="60" cy="72" rx="45" ry="34" fill="#4ade80" stroke="#166534" strokeWidth="4" />
              {/* Belly */}
              <ellipse cx="60" cy="78" rx="26" ry="18" fill="#bbf7d0" />
              {/* Left Eye */}
              <circle cx="42" cy="40" r="14" fill="#ffffff" stroke="#166534" strokeWidth="4" />
              <circle cx="44" cy="40" r="6" fill="#1e293b" />
              <circle cx="42" cy="38" r="2.5" fill="#ffffff" />
              {/* Right Eye */}
              <circle cx="78" cy="40" r="14" fill="#ffffff" stroke="#166534" strokeWidth="4" />
              <circle cx="76" cy="40" r="6" fill="#1e293b" />
              <circle cx="74" cy="38" r="2.5" fill="#ffffff" />
              {/* Rosy Cheeks */}
              <circle cx="34" cy="74" r="5.5" fill="#f472b6" opacity="0.75" />
              <circle cx="86" cy="74" r="5.5" fill="#f472b6" opacity="0.75" />
              {/* Smile */}
              <path d="M 48 74 Q 60 86 72 74" fill="none" stroke="#166534" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Message Container with pop transition */}
        <div style={{ minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span
            className={animateText ? "animate-kids-pulse-scale" : ""}
            style={{
              fontSize: "1.25rem",
              fontWeight: "800",
              color: "var(--text-primary)",
              lineHeight: "1.5",
              display: "block",
              transition: "opacity 0.2s, transform 0.2s",
              opacity: animateText ? 1 : 0,
              transform: animateText ? "scale(1)" : "scale(0.95)"
            }}
          >
            {LOADING_MESSAGES[messageIndex]}
          </span>
        </div>

        {/* Playful bouncing loading dots */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
          <div
            className="animate-kids-bounce"
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-primary)",
              animationDelay: "0s"
            }}
          />
          <div
            className="animate-kids-bounce"
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-secondary)",
              animationDelay: "0.2s"
            }}
          />
          <div
            className="animate-kids-bounce"
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "var(--success)",
              animationDelay: "0.4s"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default KidsLoader;
