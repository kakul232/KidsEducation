import React from "react";
import { KidsModal } from "../../../components/KidsModal";
import { AvatarIcon } from "../../../components/AvatarIcon";
import { useApp } from "../../../context/AppContext";
import LocalDB from "../../../services/db";
import type { Student, Challenge } from "../../../services/db";

interface FlexModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFlexGame: { gameId: string; title: string; score: number } | null;
  friendsList: Student[];
  onSuccess: (successMsg: string) => void;
  onError: (errorMsg: string) => void;
}

export const FlexModal: React.FC<FlexModalProps> = ({
  isOpen,
  onClose,
  activeFlexGame,
  friendsList,
  onSuccess,
  onError
}) => {
  const { currentStudent, speakText } = useApp();

  const handleFlex = async (friendId: string, friendName: string) => {
    if (!currentStudent || !activeFlexGame) return;
    try {
      const flexId = "flex_" + Math.random().toString(36).substring(2, 11);
      const flex: Challenge = {
        id: flexId,
        type: "flex",
        senderId: currentStudent.id,
        senderName: currentStudent.name,
        receiverId: friendId,
        receiverName: friendName,
        gameId: activeFlexGame.gameId,
        gameTitle: activeFlexGame.title,
        senderScore: activeFlexGame.score,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      await LocalDB.sendChallenge(flex);
      speakText(`Flexed your score with ${friendName}!`);
      onSuccess(`Flexed your score of ${activeFlexGame.score} in ${activeFlexGame.title} with ${friendName}! 💪`);
      onClose();
    } catch (err) {
      console.error("Failed to flex score:", err);
      onError("Failed to flex score with friend.");
    }
  };

  return (
    <KidsModal
      isOpen={isOpen && !!activeFlexGame}
      onClose={onClose}
      maxWidth="360px"
      padding="24px"
    >
      <h3 className="flex-modal-title">
        💪 Flex Your Score!
      </h3>
      <p className="flex-modal-desc">
        Flex your score of <strong>{activeFlexGame?.score}</strong> in <strong>{activeFlexGame?.title}</strong> on a friend:
      </p>

      {friendsList.length === 0 ? (
        <p className="flex-modal-empty">
          Add some friends first to flex your scores!
        </p>
      ) : (
        <div className="flex-modal-list">
          {friendsList.map(friend => (
            <button
              key={friend.id}
              onClick={() => handleFlex(friend.id, friend.name)}
              className="btn btn-gray flex-modal-btn"
            >
              <AvatarIcon avatarId={friend.avatar} size="sm" />
              <span>Flex with {friend.name}</span>
            </button>
          ))}
        </div>
      )}

      <button
        autoFocus
        onClick={onClose}
        className="btn btn-gray flex-modal-close"
      >
        Close
      </button>
    </KidsModal>
  );
};
