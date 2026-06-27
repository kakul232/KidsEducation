import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, GraduationCap } from "lucide-react";

// Pre-defined SVG Avatars for children
const AVATARS = [
  { id: "bear", label: "🐻 Bear", color: "#fca5a5" },
  { id: "cat", label: "🐱 Cat", color: "#fde047" },
  { id: "fox", label: "🦊 Fox", color: "#fdba74" },
  { id: "frog", label: "🐸 Frog", color: "#86efac" },
  { id: "panda", label: "🐼 Panda", color: "#e2e8f0" }
];

export const Onboarding: React.FC = () => {
  const { setOnboarding, setView } = useApp();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("bear");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please tell us your name! 😊");
      return;
    }
    setErrorMsg("");
    setOnboarding(name.trim(), selectedAvatar);
  };

  return (
    <div className="container animate-slide-up" style={{ justifyContent: "center" }}>
      <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Title & Welcome */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--accent-secondary)",
              color: "#fff",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              boxShadow: "0 8px 20px rgba(14, 165, 233, 0.3)"
            }}
          >
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: "var(--font-size-title)", color: "var(--text-primary)" }}>
            Welcome!
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px" }}>
            Let's start our learning game journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              htmlFor="student-name-input"
              style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.1rem" }}
            >
              What is your name?
            </label>
            <input
              id="student-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name here..."
              maxLength={20}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "1.1rem",
                borderRadius: "16px",
                border: "3px solid #cbd5e1",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontWeight: "600",
                textAlign: "center"
              }}
            />
            {errorMsg && (
              <span style={{ color: "var(--accent-primary)", fontWeight: "600", fontSize: "0.95rem" }}>
                {errorMsg}
              </span>
            )}
          </div>

          {/* Avatar Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.1rem" }}>
              Choose your Avatar:
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.id)}
                  style={{
                    backgroundColor: selectedAvatar === avatar.id ? avatar.color : "transparent",
                    border: selectedAvatar === avatar.id ? "3px solid var(--text-primary)" : "3px dashed #cbd5e1",
                    borderRadius: "16px",
                    padding: "10px 4px",
                    fontSize: "1.8rem",
                    cursor: "pointer",
                    transition: "transform 0.15s, background-color 0.2s"
                  }}
                  className="animate-bounce-slow"
                  title={avatar.label}
                >
                  {avatar.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary" style={{ padding: "18px" }}>
            Start Learning
          </button>
        </form>

        <hr style={{ border: 0, borderTop: "2px solid #e2e8f0" }} />

        {/* Link to Admin View */}
        <button
          onClick={() => setView("admin_auth")}
          className="btn btn-gray"
          style={{ padding: "10px", fontSize: "0.9rem", boxShadow: "none" }}
        >
          <GraduationCap size={18} />
          Teachers / Admin Portal
        </button>
      </div>
    </div>
  );
};
export default Onboarding;
