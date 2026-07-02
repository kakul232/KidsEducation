import React, { useState, useEffect } from "react";
import { AVATARS } from "../../../utils/constants";
import { ChunkyButton } from "../../../components/ChunkyButton";
import LocalDB, { Student } from "../../../services/db";

interface LoginFormProps {
  onSelectStudent: (student: Student) => void;
  setIsLoading: (loading: boolean) => void;
  setErrorMsg: (msg: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSelectStudent,
  setIsLoading,
  setErrorMsg
}) => {
  const [loginPhone, setLoginPhone] = useState("");
  const [foundStudents, setFoundStudents] = useState<Student[]>([]);
  const [hasSearchedLoginPhone, setHasSearchedLoginPhone] = useState(false);

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
  }, [setIsLoading]);

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

  const handleResetPhone = () => {
    localStorage.removeItem("saved_parent_phone");
    setLoginPhone("");
    setFoundStudents([]);
    setHasSearchedLoginPhone(false);
  };

  return (
    <div className="login-container">
      {!hasSearchedLoginPhone ? (
        <form onSubmit={handleLoginSearch} className="login-search-form">
          <div className="form-group">
            <label htmlFor="login-phone-input" className="form-label-bold">
              Parent's Phone Number 📱
            </label>
            <input
              id="login-phone-input"
              type="tel"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="Type phone number here..."
              maxLength={15}
              className="login-phone-input"
            />
          </div>
          <ChunkyButton type="submit" variant="secondary" className="onboarding-submit-btn">
            🔍 Find My Profile
          </ChunkyButton>
        </form>
      ) : (
        <div className="found-students-container">
          <span className="profile-helper-text">
            {foundStudents.length === 0
              ? "No profiles found! Make sure to Join In first! 🦖"
              : "Tap your face to unlock! 👇"}
          </span>
          <div className="profile-grid">
            {foundStudents.map(student => {
              const avatarInfo = AVATARS.find(a => a.id === student.avatar) || AVATARS[0];
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student)}
                  className="student-card-btn"
                  style={{
                    borderColor: avatarInfo.color || "#e2e8f0",
                    boxShadow: `0 8px 0 ${avatarInfo.color || "#cbd5e1"}44`,
                    ["--hover-shadow-color" as any]: `${avatarInfo.color || "#cbd5e1"}55`
                  }}
                >
                  <span className="student-avatar-emoji">
                    {avatarInfo.label.split(" ")[0]}
                  </span>
                  <span className="student-card-name">
                    {student.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="use-different-phone-container">
            <button
              type="button"
              onClick={handleResetPhone}
              className="different-phone-btn"
            >
              🔄 Use different phone number
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
