import React, { useState } from "react";
import { Send } from "lucide-react";
import { KidsModal } from "../../../components/KidsModal";
import { useApp } from "../../../context/AppContext";
import LocalDB from "../../../services/db";

interface RequestIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestIdeaModal: React.FC<RequestIdeaModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentStudent, speakText } = useApp();
  const [ideaText, setIdeaText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ideaId = "req_" + Date.now();
      const newRequest = {
        id: ideaId,
        studentId: currentStudent?.id || "guest",
        studentName: currentStudent?.name || "Guest Student",
        idea: ideaText.trim(),
        createdAt: new Date().toISOString()
      };

      await LocalDB.saveGameRequest(newRequest);
      speakText("Idea sent! Thank you for sharing your suggestion!");
      setIdeaText("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save student request:", err);
      alert("Oops! Failed to submit your idea. Try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KidsModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="420px"
      padding="24px"
    >
      <div className="idea-modal-header">
        <h3 className="idea-modal-title">
          <span>💡 Shared Idea Studio</span>
        </h3>
        <button
          onClick={onClose}
          className="idea-modal-close"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="idea-modal-form">
        <p className="idea-modal-desc">
          What kind of game do you want to play? Write or describe your game idea below:
        </p>

        <textarea
          autoFocus
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          placeholder="E.g., 'I want a balloon counting game with cute dinosaurs!' or 'A puzzle game where I match shapes!'"
          rows={4}
          required
          className="idea-modal-textarea"
        />

        <div className="idea-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-gray idea-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary idea-modal-submit"
          >
            <Send size={16} fill="white" />
            <span>{isSubmitting ? "Sending..." : "Send Idea! 🚀"}</span>
          </button>
        </div>
      </form>
    </KidsModal>
  );
};
