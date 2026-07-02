import React from "react";
import { KidsModal } from "../../../components/KidsModal";

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onClose
}) => {
  const handleLogout = () => {
    localStorage.removeItem("active_student_id");
    window.location.reload();
  };

  return (
    <KidsModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={1000}
      maxWidth="350px"
    >
      <div className="exit-modal-icon">🚪</div>
      <h3 className="exit-modal-title">
        Are you leaving?
      </h3>
      <p className="exit-modal-desc">
        Do you really want to close your dashboard and exit?
      </p>
      <div className="exit-modal-actions">
        <button
          autoFocus
          onClick={onClose}
          className="btn btn-success exit-modal-keep-btn"
        >
          🎮 Keep Playing!
        </button>
        <button
          onClick={handleLogout}
          className="exit-modal-yes-btn"
        >
          🚪 Yes, Exit
        </button>
      </div>
    </KidsModal>
  );
};
