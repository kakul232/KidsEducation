import React from "react";
import { PlayCard } from "../../../components/PlayCard";
import type { Student } from "../../../services/db";

interface ValidityExpiredViewProps {
  currentStudent: Student;
}

export const ValidityExpiredView: React.FC<ValidityExpiredViewProps> = ({ currentStudent }) => {
  const handleLogout = () => {
    localStorage.removeItem("active_student_id");
    window.location.reload();
  };

  return (
    <div className="container expired-container animate-slide-up">
      <PlayCard className="expired-card">
        <div className="expired-icon">⏰</div>
        <h2 className="expired-title">
          Time to Renew! 🌟
        </h2>
        <p className="expired-desc">
          Hi {currentStudent.name}! Your learning dashboard validity has ended.
          Please ask your parents or teacher to renew it so you can keep playing and earning stars!
        </p>

        <div className="expired-details">
          <p><strong>Registered Phone:</strong> {currentStudent.phone || "N/A"}</p>
          <p><strong>Student ID:</strong> <span>{currentStudent.id}</span></p>
        </div>

        <button
          onClick={handleLogout}
          className="expired-logout-btn"
        >
          🚪 Change Account
        </button>
      </PlayCard>
    </div>
  );
};
