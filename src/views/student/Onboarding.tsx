import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, GraduationCap } from "lucide-react";
import { AVATARS } from "../../utils/constants";
import { ChunkyButton } from "../../components/ChunkyButton";
import { PlayCard } from "../../components/PlayCard";
import KidsLoader from "../../components/KidsLoader";
import LocalDB from "../../services/db";
import type { Student } from "../../services/db";
import { PatternLock } from "../../components/PatternLock";
import { getClientDetails } from "../../utils/device";

export const Onboarding: React.FC = () => {
  const { setOnboarding, setView } = useApp();
  const [activeTab, setActiveTab] = useState<"register" | "login">("login");

  // Registration Form States
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("bear");

  // Login States
  const [loginPhone, setLoginPhone] = useState("");
  const [foundStudents, setFoundStudents] = useState<Student[]>([]);
  const [hasSearchedLoginPhone, setHasSearchedLoginPhone] = useState(false);

  // Pattern Lock Flow States
  const [showPatternLock, setShowPatternLock] = useState<"set" | "verify" | null>(null);
  const [patternTargetStudent, setPatternTargetStudent] = useState<Student | null>(null);

  // Common UI states
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem("saved_parent_phone");
    if (savedPhone) {
      setLoginPhone(savedPhone);
      setIsLoading(true);
      LocalDB.getStudentsByPhone(savedPhone)
        .then(studentsList => {
          setFoundStudents(studentsList);
          setHasSearchedLoginPhone(true);
        })
        .catch(err => {
          console.error("Failed to load saved parent phone students:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
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

    try {
      const details = await getClientDetails();
      const existingStudents = await LocalDB.getStudents();
      const cleanName = name.trim().toLowerCase();

      const matched = existingStudents.find(s => {
        const sName = s.name.trim().toLowerCase();
        if (sName !== cleanName) return false;
        if (s.deviceId && s.deviceId === details.deviceId) return true;
        if (s.ip && details.ip && s.ip === details.ip) return true;
        return false;
      });

      setIsLoading(false);

      if (matched) {
        setPatternTargetStudent(matched);
        if (matched.patternLock) {
          setShowPatternLock("verify");
        } else {
          setShowPatternLock("set");
        }
      } else {
        setPatternTargetStudent(null); // New student
        setShowPatternLock("set");
      }
    } catch (err) {
      console.error("Failed during registration check:", err);
      setErrorMsg("Oops! Something went wrong. Try again! 😊");
      setIsLoading(false);
    }
  };

  const handleLoginSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      setErrorMsg("Please enter your parent's phone number! 📱");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    try {
      const studentsList = await LocalDB.getStudentsByPhone(loginPhone.trim());
      setFoundStudents(studentsList);
      setHasSearchedLoginPhone(true);
    } catch (err) {
      console.error("Failed to query students by phone:", err);
      setErrorMsg("Failed to check profiles. Try again! 😊");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLoginStudent = (student: Student) => {
    setPatternTargetStudent(student);
    if (student.patternLock) {
      setShowPatternLock("verify");
    } else {
      setShowPatternLock("set");
    }
  };

  const handlePatternSuccess = async (pattern: string) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const parentPhoneToSave = patternTargetStudent?.phone || phone.trim();
      if (parentPhoneToSave) {
        localStorage.setItem("saved_parent_phone", parentPhoneToSave);
      }
      if (showPatternLock === "set") {
        if (patternTargetStudent) {
          // Matched student with no pattern lock previously
          await setOnboarding(
            patternTargetStudent.name,
            patternTargetStudent.avatar,
            patternTargetStudent.age,
            patternTargetStudent.class || "",
            patternTargetStudent.phone || "",
            pattern
          );
        } else {
          // Fully new student
          const parsedAge = age.trim() ? parseInt(age) : undefined;
          await setOnboarding(name.trim(), selectedAvatar, parsedAge, studentClass.trim(), phone.trim(), pattern);
        }
      } else {
        // Verify success
        if (patternTargetStudent) {
          await setOnboarding(
            patternTargetStudent.name,
            patternTargetStudent.avatar,
            patternTargetStudent.age,
            patternTargetStudent.class || "",
            patternTargetStudent.phone || "",
            pattern
          );
        }
      }
    } catch (err) {
      console.error("Failed to log in with pattern:", err);
      setErrorMsg("Oops! Something went wrong logging in.");
      setIsLoading(false);
      setShowPatternLock(null);
    }
  };

  return (
    <div className="container animate-slide-up" style={{ justifyContent: "center" }}>
      {isLoading && <KidsLoader />}
      <PlayCard style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

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
              marginBottom: "8px",
              boxShadow: "0 8px 20px rgba(14, 165, 233, 0.3)"
            }}
          >
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: "var(--font-size-title)", color: "var(--text-primary)", margin: "0 0 4px 0" }}>
            Welcome!
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
            Let's start our learning game journey.
          </p>
        </div>

        {/* Pattern Lock Screen */}
        {showPatternLock ? (
          <PatternLock
            mode={showPatternLock}
            targetPattern={patternTargetStudent?.patternLock}
            onSuccess={handlePatternSuccess}
            onCancel={() => {
              setShowPatternLock(null);
              setPatternTargetStudent(null);
            }}
            onForgot={() => {
              alert("🐸 Ribbit! Please ask Frog Uncle (+91 9871229599) or your educator to reset your pattern lock from the dashboard!");
            }}
            title={
              showPatternLock === "set"
                ? `Set Pattern for ${patternTargetStudent ? patternTargetStudent.name : name}`
                : `Draw Pattern to log in as ${patternTargetStudent?.name}`
            }
          />
        ) : (
          <>
            {/* Tab Controls */}
            <div style={{ display: "flex", gap: "8px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "12px", marginBottom: "4px" }}>
              <button
                type="button"
                onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: activeTab === "login" ? "#fff" : "transparent",
                  color: activeTab === "login" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: activeTab === "login" ? "0 4px 6px rgba(0,0,0,0.05)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                🔑 Kid Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("register"); setErrorMsg(""); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: activeTab === "register" ? "#fff" : "transparent",
                  color: activeTab === "register" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: activeTab === "register" ? "0 4px 6px rgba(0,0,0,0.05)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                🆕 Join In (Register)
              </button>
            </div>

            {errorMsg && (
              <span style={{ color: "var(--accent-primary)", fontWeight: "700", fontSize: "0.9rem", textAlign: "center", display: "block" }}>
                ⚠️ {errorMsg}
              </span>
            )}

            {activeTab === "register" ? (
              /* Registration Form */
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Name Input */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label
                    htmlFor="student-name-input"
                    style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}
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
                      padding: "10px",
                      fontSize: "0.95rem",
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
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label
                    htmlFor="student-age-input"
                    style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}
                  >
                    How old are you? (Optional)
                  </label>
                  <select
                    id="student-age-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "0.95rem",
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
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label
                    htmlFor="student-class-input"
                    style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}
                  >
                    What class are you in? (Optional)
                  </label>
                  <select
                    id="student-class-input"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      fontSize: "0.95rem",
                      borderRadius: "12px",
                      border: "3px solid #cbd5e1",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontWeight: "600",
                      textAlign: "center",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Select class ... 🏫</option>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label
                    htmlFor="student-phone-input"
                    style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}
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
                      padding: "10px",
                      fontSize: "0.95rem",
                      borderRadius: "12px",
                      border: "3px solid #cbd5e1",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-primary)",
                      fontWeight: "600",
                      textAlign: "center"
                    }}
                  />
                </div>

                {/* Avatar Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                    Choose your Avatar:
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                    {AVATARS.map(avatar => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.id)}
                        style={{
                          backgroundColor: selectedAvatar === avatar.id ? avatar.color : "transparent",
                          border: selectedAvatar === avatar.id ? "3px solid var(--text-primary)" : "3px dashed #cbd5e1",
                          borderRadius: "14px",
                          padding: "6px 2px",
                          fontSize: "1.6rem",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                        title={avatar.label}
                      >
                        {avatar.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <ChunkyButton type="submit" variant="primary" style={{ padding: "14px", marginTop: "6px" }}>
                  Start Learning
                </ChunkyButton>
              </form>
            ) : (
              /* Login Form */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {!hasSearchedLoginPhone ? (
                  <form onSubmit={handleLoginSearch} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label
                        htmlFor="login-phone-input"
                        style={{ fontWeight: "800", color: "var(--text-primary)", fontSize: "0.95rem" }}
                      >
                        Parent's Phone Number 📱
                      </label>
                      <input
                        id="login-phone-input"
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="Type phone number here..."
                        maxLength={15}
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: "1rem",
                          borderRadius: "16px",
                          border: "3.5px solid #cbd5e1",
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-primary)",
                          fontWeight: "800",
                          textAlign: "center",
                          outline: "none",
                          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)"
                        }}
                      />
                    </div>
                    <ChunkyButton type="submit" variant="secondary" style={{ padding: "14px" }}>
                      🔍 Find My Profile
                    </ChunkyButton>
                  </form>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span style={{ fontWeight: "900", color: "var(--text-primary)", fontSize: "1.05rem", textAlign: "center", marginBottom: "4px" }}>
                      {foundStudents.length === 0
                        ? "No profiles found! Make sure to Join In first! 🦖"
                        : "Tap your face to unlock! 👇"}
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                      {foundStudents.map(student => {
                        const avatarInfo = AVATARS.find(a => a.id === student.avatar) || AVATARS[0];
                        return (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleSelectLoginStudent(student)}
                            style={{
                              backgroundColor: "#ffffff",
                              border: `4px solid ${avatarInfo.color || "#e2e8f0"}`,
                              borderRadius: "24px",
                              padding: "16px 8px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              boxShadow: `0 8px 0 ${avatarInfo.color || "#cbd5e1"}44`,
                              transition: "all 0.2s ease-in-out",
                              position: "relative"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                              e.currentTarget.style.boxShadow = `0 12px 0 ${avatarInfo.color || "#cbd5e1"}55`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0) scale(1)";
                              e.currentTarget.style.boxShadow = `0 8px 0 ${avatarInfo.color || "#cbd5e1"}44`;
                            }}
                          >
                            <span style={{ fontSize: "3rem", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}>
                              {avatarInfo.label.split(" ")[0]}
                            </span>
                            <span style={{ fontWeight: "900", fontSize: "0.9rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>
                              {student.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("saved_parent_phone");
                          setLoginPhone("");
                          setFoundStudents([]);
                          setHasSearchedLoginPhone(false);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-secondary)",
                          fontWeight: "800",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          textDecoration: "underline",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        🔄 Use different phone number
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <hr style={{ border: 0, borderTop: "2px solid #e2e8f0", margin: "10px 0 0 0" }} />

        {/* Link to Admin View */}
        <ChunkyButton
          onClick={() => setView("admin_auth")}
          variant="gray"
          style={{ padding: "10px", fontSize: "0.85rem", boxShadow: "none" }}
        >
          <GraduationCap size={18} />
          Teachers / Admin Portal
        </ChunkyButton>
      </PlayCard>
    </div>
  );
};

export default Onboarding;
