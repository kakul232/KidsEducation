import React from "react";
import { KidsModal } from "../../../components/KidsModal";
import { useApp } from "../../../context/AppContext";

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  reason: "premium" | "stars";
  starsRequired: number;
}

export const LockModal: React.FC<LockModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  reason,
  starsRequired
}) => {
  const { currentStudent } = useApp();
  const currentStars = currentStudent?.stars || 0;
  const isStars = reason === "stars";

  return (
    <KidsModal
      isOpen={isOpen}
      onClose={onClose}
      borderColor="#ef4444"
      maxWidth="360px"
    >
      <div className="lock-modal-icon">
        {isStars ? "⭐" : "🔒"}
      </div>
      <h3 className={isStars ? "lock-modal-title-stars" : "lock-modal-title-premium"}>
        {isStars ? "Stars Required!" : "Premium Game!"}
      </h3>
      <p className="lock-modal-desc">
        {isStars ? (
          <span>
            You need <strong>{starsRequired.toLocaleString()}</strong> Stars to unlock "{gameTitle}".<br />
            You currently have <strong>{currentStars}</strong> stars. Keep playing to collect more! 🎈
          </span>
        ) : (
          <span>
            "{gameTitle}" is a premium quest. Please ask your parent or teacher to unlock it for you!
          </span>
        )}
      </p>
      <button
        autoFocus
        onClick={onClose}
        className={`btn lock-modal-btn ${isStars ? "lock-btn-stars" : "lock-btn-premium"}`}
      >
        {isStars ? "Okay! 🎮" : "Go Back"}
      </button>
    </KidsModal>
  );
};
