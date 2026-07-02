import React from "react";
import { KidsModal } from "../../../components/KidsModal";
import { useApp } from "../../../context/AppContext";
import type { Student } from "../../../services/db";

interface TrialPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrialActivated: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}

export const TrialPopupModal: React.FC<TrialPopupModalProps> = ({
  isOpen,
  onClose,
  onTrialActivated,
  onShowSuccess,
  onShowError
}) => {
  const { currentStudent, updateStudent, speakText } = useApp();

  const handleActivate = async () => {
    if (!currentStudent) return;
    try {
      const trialUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const updated: Student = {
        ...currentStudent,
        trialUntil
      };
      await updateStudent(updated);
      speakText("Hooray! Your 7-day premium trial is now active! Go explore challenges and friends progress!");
      onShowSuccess("Hooray! Premium Trial Activated for 7 days! 💎");
      onTrialActivated();
      onClose();
    } catch (err) {
      console.error("Failed to activate trial:", err);
      onShowError("Failed to activate trial. Please try again.");
    }
  };

  return (
    <KidsModal
      isOpen={isOpen}
      onClose={onClose}
      backgroundColor="#eff6ff"
      borderColor="#3b82f6"
      maxWidth="380px"
      padding="32px 24px"
      zIndex={10010}
      className="trial-modal"
    >
      <div className="trial-modal-icon">🎁</div>

      <h3 className="trial-modal-title">
        Try Premium Free! 🌟
      </h3>

      <p className="trial-modal-desc">
        Hey {currentStudent?.name || "there"}! <br />
        Activate your <strong>7-Day Free Trial</strong> to play custom games, challenge friends, and see high scores!
      </p>

      <button
        autoFocus
        onClick={handleActivate}
        className="btn btn-success trial-modal-start animate-tag-pulse"
      >
        🚀 Start My 7-Day Trial!
      </button>

      <button
        onClick={onClose}
        className="btn btn-gray trial-modal-close"
      >
        Maybe Later
      </button>
    </KidsModal>
  );
};
