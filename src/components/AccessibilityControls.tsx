import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Volume2, VolumeX, Eye, Type, ZoomIn, Settings, X } from "lucide-react";
import { AVATARS } from "../utils/constants";

export const AccessibilityControls: React.FC = () => {
  const { accessibility, updateAccessibility, speakText, currentStudent, updateStudent } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      speakText("Accessibility settings opened.");
    }
  };

  const handleFontToggle = () => {
    const nextVal = !accessibility.useDyslexicFont;
    updateAccessibility({ useDyslexicFont: nextVal });
    speakText(nextVal ? "Dyslexic font turned on." : "Standard font turned on.");
  };

  const handleContrastToggle = () => {
    const nextVal = !accessibility.highContrast;
    updateAccessibility({ highContrast: nextVal });
    speakText(nextVal ? "High contrast mode active." : "Standard colors active.");
  };

  const handleVoiceToggle = () => {
    const nextVal = !accessibility.voiceAssistance;
    updateAccessibility({ voiceAssistance: nextVal });
    // Directly invoke local TTS alert since config state change is async
    if (nextVal) {
      const utterance = new SpeechSynthesisUtterance("Voice instructions turned on.");
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFontSizeCycle = () => {
    let nextSize: "normal" | "large" | "xlarge" = "normal";
    if (accessibility.fontSize === "normal") nextSize = "large";
    else if (accessibility.fontSize === "large") nextSize = "xlarge";
    
    updateAccessibility({ fontSize: nextSize });
    speakText(`Font size set to ${nextSize}.`);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={toggleOpen}
        className="btn btn-secondary animate-bounce-slow"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          padding: 0,
          zIndex: 9999,
          boxShadow: "0 10px 25px rgba(14, 165, 233, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        aria-label="Accessibility Settings"
        id="accessibility-toggle-btn"
      >
        {isOpen ? <X size={28} /> : <Settings size={28} />}
      </button>

      {/* Settings Modal Drawer */}
      {isOpen && (
        <div
          className="animate-pop-in"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "320px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 9998,
            border: "3px solid var(--accent-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Accessibility Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>
          </div>

          <hr style={{ border: 0, borderTop: "2px solid #e2e8f0" }} />

          {/* Option: Dyslexic Font */}
          <button
            onClick={handleFontToggle}
            className="btn"
            style={{
              justifyContent: "flex-start",
              backgroundColor: accessibility.useDyslexicFont ? "var(--success)" : "#f1f5f9",
              color: accessibility.useDyslexicFont ? "#fff" : "var(--text-primary)",
              padding: "12px 18px",
              borderRadius: "16px",
              boxShadow: "none"
            }}
          >
            <Type size={20} />
            <span style={{ fontSize: "0.95rem" }}>OpenDyslexic Font</span>
          </button>

          {/* Option: Font Size */}
          <button
            onClick={handleFontSizeCycle}
            className="btn"
            style={{
              justifyContent: "flex-start",
              backgroundColor: accessibility.fontSize !== "normal" ? "var(--success)" : "#f1f5f9",
              color: accessibility.fontSize !== "normal" ? "#fff" : "var(--text-primary)",
              padding: "12px 18px",
              borderRadius: "16px",
              boxShadow: "none"
            }}
          >
            <ZoomIn size={20} />
            <span style={{ fontSize: "0.95rem" }}>
              Font Size: {accessibility.fontSize.toUpperCase()}
            </span>
          </button>

          {/* Option: High Contrast */}
          <button
            onClick={handleContrastToggle}
            className="btn"
            style={{
              justifyContent: "flex-start",
              backgroundColor: accessibility.highContrast ? "var(--success)" : "#f1f5f9",
              color: accessibility.highContrast ? "#fff" : "var(--text-primary)",
              padding: "12px 18px",
              borderRadius: "16px",
              boxShadow: "none"
            }}
          >
            <Eye size={20} />
            <span style={{ fontSize: "0.95rem" }}>High Contrast</span>
          </button>

          {/* Option: Read Aloud */}
          <button
            onClick={handleVoiceToggle}
            className="btn"
            style={{
              justifyContent: "flex-start",
              backgroundColor: accessibility.voiceAssistance ? "var(--success)" : "#f1f5f9",
              color: accessibility.voiceAssistance ? "#fff" : "var(--text-primary)",
              padding: "12px 18px",
              borderRadius: "16px",
              boxShadow: "none"
            }}
          >
            {accessibility.voiceAssistance ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span style={{ fontSize: "0.95rem" }}>Voice Guidance</span>
          </button>

          {/* Profile Settings Section */}
          {currentStudent && (
            <>
              <hr style={{ border: 0, borderTop: "2px solid #cbd5e1" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: "800" }}>
                  👤 Edit My Profile
                </h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="edit-profile-name" style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>Name</label>
                  <input
                    id="edit-profile-name"
                    type="text"
                    placeholder="My Name"
                    defaultValue={currentStudent.name}
                    onBlur={async (e) => {
                      const val = e.target.value.trim();
                      if (val && val !== currentStudent.name) {
                        await updateStudent({ ...currentStudent, name: val });
                        speakText(`Name updated to ${val}`);
                      }
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "2px solid #cbd5e1",
                      fontSize: "0.85rem",
                      width: "100%",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="edit-profile-age" style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>Age (Optional)</label>
                  <select
                    id="edit-profile-age"
                    value={currentStudent.age || ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const parsed = val ? parseInt(val) : undefined;
                      await updateStudent({ ...currentStudent, age: parsed });
                      speakText(`Age updated to ${val || "none"}`);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "2px solid #cbd5e1",
                      fontSize: "0.85rem",
                      width: "100%",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Select age (Optional)... 🎂</option>
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

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label htmlFor="edit-profile-class" style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>Class</label>
                  <select
                    id="edit-profile-class"
                    value={currentStudent.class || ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      await updateStudent({ ...currentStudent, class: val });
                      speakText(`Class updated to ${val || "none"}`);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "2px solid #cbd5e1",
                      fontSize: "0.85rem",
                      width: "100%",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Select class... 🏫</option>
                    <option value="Preschool">Preschool</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)" }}>Avatar</span>
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", width: "100%" }}>
                    {AVATARS.map(av => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={async () => {
                          await updateStudent({ ...currentStudent, avatar: av.id });
                          speakText(`Avatar changed to ${av.label}`);
                        }}
                        style={{
                          padding: "6px",
                          borderRadius: "10px",
                          border: currentStudent.avatar === av.id ? "2.5px solid var(--accent-primary)" : "1.5px dashed #cbd5e1",
                          backgroundColor: currentStudent.avatar === av.id ? av.color : "transparent",
                          fontSize: "1.3rem",
                          cursor: "pointer",
                          flexShrink: 0
                        }}
                        title={av.label}
                      >
                        {av.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
