import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, GraduationCap } from "lucide-react";
import { ChunkyButton } from "../../components/ChunkyButton";
import { PlayCard } from "../../components/PlayCard";
import KidsLoader from "../../components/KidsLoader";
import LocalDB from "../../services/db";
import type { Student } from "../../services/db";
import { PatternLock } from "../../components/PatternLock";
import { getClientDetails } from "../../utils/device";

import { RegistrationForm } from "./onboarding/RegistrationForm";
import type { RegistrationData } from "./onboarding/RegistrationForm";
import { LoginForm } from "./onboarding/LoginForm";
import "./Onboarding.css";

export const Onboarding: React.FC = () => {
  const { setOnboarding, setView } = useApp();
  const [activeTab, setActiveTab] = useState<"register" | "login">("login");

  // Temporary registration data held during the pattern lock creation step
  const [tempRegistrationData, setTempRegistrationData] = useState<RegistrationData | null>(null);

  // Pattern Lock Flow States
  const [showPatternLock, setShowPatternLock] = useState<"set" | "verify" | null>(null);
  const [patternTargetStudent, setPatternTargetStudent] = useState<Student | null>(null);

  // Common UI states
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = async (data: RegistrationData) => {
    setTempRegistrationData(data);
    setIsLoading(true);
    setErrorMsg("");

    try {
      const details = await getClientDetails();
      const existingStudents = await LocalDB.getStudents();
      const cleanName = data.name.trim().toLowerCase();

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
        setPatternTargetStudent(null); // New student profile matching criteria not found
        setShowPatternLock("set");
      }
    } catch (err) {
      console.error("Failed during registration check:", err);
      setErrorMsg("Oops! Something went wrong. Try again! 😊");
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
      const parentPhoneToSave = patternTargetStudent?.phone || tempRegistrationData?.phone || "";
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
            pattern,
            patternTargetStudent.id
          );
        } else if (tempRegistrationData) {
          // Fully new student profile creation
          const parsedAge = tempRegistrationData.age.trim() ? parseInt(tempRegistrationData.age) : undefined;
          await setOnboarding(
            tempRegistrationData.name,
            tempRegistrationData.selectedAvatar,
            parsedAge,
            tempRegistrationData.studentClass,
            tempRegistrationData.phone,
            pattern
          );
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
            pattern,
            patternTargetStudent.id
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
    <div className="container onboarding-container animate-slide-up">
      {isLoading && <KidsLoader />}
      <PlayCard className="onboarding-card">
        
        {/* Title & Welcome */}
        <div className="onboarding-header">
          <div className="onboarding-sparkle-icon">
            <Sparkles size={32} />
          </div>
          <h1 className="onboarding-title">Welcome!</h1>
          <p className="onboarding-subtitle">
            Let's start our learning game journey.
          </p>
        </div>

        {/* Pattern Lock Screen or Primary Flow forms */}
        {showPatternLock ? (
          <PatternLock
            mode={showPatternLock}
            targetPattern={patternTargetStudent?.patternLock}
            onSuccess={handlePatternSuccess}
            onCancel={() => {
              setShowPatternLock(null);
              setPatternTargetStudent(null);
              setTempRegistrationData(null);
            }}
            onForgot={() => {
              alert("🐸 Ribbit! Please ask Frog Uncle (+91 9871229599) or your educator to reset your pattern lock from the dashboard!");
            }}
            title={
              showPatternLock === "set"
                ? `Set Pattern for ${patternTargetStudent ? patternTargetStudent.name : (tempRegistrationData ? tempRegistrationData.name : "")}`
                : `Draw Pattern to log in as ${patternTargetStudent?.name}`
            }
          />
        ) : (
          <>
            {/* Tab Controls */}
            <div className="onboarding-tabs">
              <button
                type="button"
                onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
                className={`onboarding-tab-btn ${activeTab === "login" ? "active" : ""}`}
              >
                🔑 Kid Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("register"); setErrorMsg(""); }}
                className={`onboarding-tab-btn ${activeTab === "register" ? "active" : ""}`}
              >
                🆕 Join In (Register)
              </button>
            </div>

            {errorMsg && (
              <span className="onboarding-error">
                ⚠️ {errorMsg}
              </span>
            )}

            {activeTab === "register" ? (
              <RegistrationForm
                onSubmit={handleRegisterSubmit}
                setErrorMsg={setErrorMsg}
              />
            ) : (
              <LoginForm
                onSelectStudent={handleSelectLoginStudent}
                setIsLoading={setIsLoading}
                setErrorMsg={setErrorMsg}
              />
            )}
          </>
        )}

        <hr className="onboarding-divider" />

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
