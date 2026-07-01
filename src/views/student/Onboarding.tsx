import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, GraduationCap } from "lucide-react";
import { AVATARS } from "../../utils/constants";
import { ChunkyButton } from "../../components/ChunkyButton";
import { PlayCard } from "../../components/PlayCard";
import KidsLoader from "../../components/KidsLoader";

export const Onboarding: React.FC = () => {
  const { setOnboarding, setView } = useApp();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("bear");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please tell us your name! 😊");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Please tell us your parent's phone number! 📱");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    const parsedAge = age.trim() ? parseInt(age) : undefined;
    try {
      await setOnboarding(name.trim(), selectedAvatar, parsedAge, studentClass.trim(), phone.trim());
    } catch (err) {
      console.error("Onboarding failed:", err);
      setErrorMsg("Oops! Something went wrong. Try again! 😊");
      setIsLoading(false);
    }
  };

  return (
    <div className="container animate-slide-up" style={{ justifyContent: "center" }}>
      {isLoading && <KidsLoader />}
      <PlayCard style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="student-name-input"
              style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.05rem" }}
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
                padding: "12px",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "3px solid #cbd5e1",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontWeight: "600",
                textAlign: "center"
              }}
            />
          </div>

          {/* Age Input Dropdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="student-age-input"
              style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.05rem" }}
            >
              How old are you? (Optional)
            </label>
            <select
              id="student-age-input"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "3px solid #cbd5e1",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontWeight: "600",
                textAlign: "center",
                cursor: "pointer"
              }}
            >
              <option value="">Select age... 🎂</option>
              <option value="3">3 Years Old</option>
              <option value="4">4 Years Old</option>
              <option value="5">5 Years Old</option>
              <option value="6">6 Years Old</option>
              <option value="7">7 Years Old</option>
              <option value="8">8 Years Old</option>
              <option value="9">9 Years Old</option>
              <option value="10">10 Years Old</option>
              <option value="11">11 Years Old</option>
              <option value="12">12 Years Old</option>
            </select>
          </div>

          {/* Class Input Dropdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="student-class-input"
              style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.05rem" }}
            >
              What class are you in? (Optional)
            </label>
            <select
              id="student-class-input"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "3px solid #cbd5e1",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontWeight: "600",
                textAlign: "center",
                cursor: "pointer"
              }}
            >
              <option value="">Select class (Optional) 🏫</option>
              <option value="Preschool">Preschool 🧸</option>
              <option value="Kindergarten">Kindergarten 🎒</option>
              <option value="Grade 1">Grade 1 ✏️</option>
              <option value="Grade 2">Grade 2 📚</option>
              <option value="Grade 3">Grade 3 🧠</option>
              <option value="Grade 4">Grade 4 🌌</option>
              <option value="Grade 5">Grade 5 🚀</option>
              <option value="Grade 6">Grade 6 🪐</option>
              <option value="Grade 7">Grade 7 🛸</option>
            </select>
          </div>

          {/* Phone No Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="student-phone-input"
              style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "1.05rem" }}
            >
              Parent's Phone Number
            </label>
            <input
              id="student-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Type phone number here..."
              maxLength={15}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "3px solid #cbd5e1",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontWeight: "600",
                textAlign: "center"
              }}
            />
            {errorMsg && (
              <span style={{ color: "var(--accent-primary)", fontWeight: "700", fontSize: "0.9rem", textAlign: "center", marginTop: "4px", display: "block" }}>
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
          <ChunkyButton type="submit" variant="primary" style={{ padding: "18px" }}>
            Start Learning
          </ChunkyButton>
        </form>

        <hr style={{ border: 0, borderTop: "2px solid #e2e8f0" }} />

        {/* Link to Admin View */}
        <ChunkyButton
          onClick={() => setView("admin_auth")}
          variant="gray"
          style={{ padding: "10px", fontSize: "0.9rem", boxShadow: "none" }}
        >
          <GraduationCap size={18} />
          Teachers / Admin Portal
        </ChunkyButton>
      </PlayCard>
    </div>
  );
};
export default Onboarding;
