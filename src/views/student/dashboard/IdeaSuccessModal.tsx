import React from "react";
import { KidsModal } from "../../../components/KidsModal";

interface IdeaSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IdeaSuccessModal: React.FC<IdeaSuccessModalProps> = ({ isOpen, onClose }) => {
  return (
    <KidsModal
      isOpen={isOpen}
      onClose={onClose}
      borderColor="#10b981"
      maxWidth="360px"
    >
      <div className="success-modal-icon">🎉</div>
      <h3 className="success-modal-title">
        Idea Sent! Yay!
      </h3>
      <p className="success-modal-desc">
        Your game suggestion was sent straight to your teacher! Keep checking your dashboard for new games!
      </p>
      <button
        autoFocus
        onClick={onClose}
        className="btn btn-success success-modal-btn"
      >
        Okay! 🎈
      </button>
    </KidsModal>
  );
};
