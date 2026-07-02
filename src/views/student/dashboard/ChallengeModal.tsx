import React from "react";
import { KidsModal } from "../../../components/KidsModal";
import { useApp } from "../../../context/AppContext";
import LocalDB from "../../../services/db";
import type { Student, Game, Challenge } from "../../../services/db";

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChallengeFriend: Student | null;
  games: Game[];
  myHighscores: { gameId: string; title: string; maxCorrect: number }[];
  onSuccess: (successMsg: string) => void;
  onError: (errorMsg: string) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  activeChallengeFriend,
  games,
  myHighscores,
  onSuccess,
  onError
}) => {
  const { currentStudent, speakText } = useApp();

  const handleChallenge = async (gameId: string, gameTitle: string) => {
    if (!currentStudent || !activeChallengeFriend) return;

    // Find own highscore
    const ownScore = myHighscores.find(hs => hs.gameId === gameId)?.maxCorrect || 0;

    try {
      const challengeId = "chall_" + Math.random().toString(36).substring(2, 11);
      const challenge: Challenge = {
        id: challengeId,
        type: "challenge",
        senderId: currentStudent.id,
        senderName: currentStudent.name,
        receiverId: activeChallengeFriend.id,
        receiverName: activeChallengeFriend.name,
        gameId,
        gameTitle,
        senderScore: ownScore,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      await LocalDB.sendChallenge(challenge);
      speakText(`Challenged ${activeChallengeFriend.name} to a game!`);
      onSuccess(`Challenged ${activeChallengeFriend.name} to play ${gameTitle}! ⚔️`);
      onClose();
    } catch (err) {
      console.error("Failed to send challenge:", err);
      onError("Failed to send challenge to friend.");
    }
  };

  return (
    <KidsModal
      isOpen={isOpen && !!activeChallengeFriend}
      onClose={onClose}
      maxWidth="360px"
      padding="24px"
    >
      <h3 className="challenge-modal-title">
        ⚔️ Challenge {activeChallengeFriend?.name}!
      </h3>
      <p className="challenge-modal-desc">
        Select a game to challenge them:
      </p>

      <div className="challenge-modal-list">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => handleChallenge(game.id, game.title)}
            className="btn btn-gray challenge-modal-btn"
          >
            {game.title}
          </button>
        ))}
      </div>

      <button
        autoFocus
        onClick={onClose}
        className="btn btn-gray challenge-modal-close"
      >
        Cancel
      </button>
    </KidsModal>
  );
};
