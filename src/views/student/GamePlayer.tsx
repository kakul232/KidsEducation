import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import Sandbox from "../../components/Sandbox";
import { ArrowLeft, Star, Volume2, Sparkles, Smile } from "lucide-react";
import confetti from "canvas-confetti";
import KidsLoader from "../../components/KidsLoader";

export const GamePlayer: React.FC = () => {
  const { currentPlayingGame, setPlayingGame, addStars, recordActivity, speakText } = useApp();
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [starsAwarded, setStarsAwarded] = useState(5);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [attemptsHistory, setAttemptsHistory] = useState<Array<{ question: string; answer: string; success: boolean; timestamp: string }>>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "fail" | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    if (currentPlayingGame) {
      setIsLoadingGame(true);
      
      // Detect if replaying
      try {
        const cachedLogsVal = localStorage.getItem("cached_logs");
        if (cachedLogsVal) {
          const logs = JSON.parse(cachedLogsVal);
          const hasCompleted = logs.some((l: any) => l.gameId === currentPlayingGame.id && l.completionRate === 100);
          setIsReplaying(hasCompleted);
        }
      } catch (e) {
        console.warn("Failed to check if replaying from cached logs:", e);
      }

      const timer = setTimeout(() => {
        setIsLoadingGame(false);
        setStartTime(Date.now());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayingGame]);

  useEffect(() => {
    if (currentPlayingGame && !isLoadingGame) {
      if (isReplaying) {
        speakText(`Let's replay ${currentPlayingGame.title} to earn even more stars! Answer the questions on screen.`);
      } else {
        speakText(`Let's play ${currentPlayingGame.title}. Answer the question on the screen!`);
      }
    }
  }, [currentPlayingGame, isLoadingGame, isReplaying]);

  if (!currentPlayingGame) return null;
  if (isLoadingGame) return <KidsLoader />;

  // Synthesis Audio Feedback Tones
  const playWinSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25]; // Playful C-major chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.4);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    } catch (e) {
      console.warn("Audio Context failed to play win chime", e);
    }
  };

  const playTrySound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const handleAttempt = () => {
    setAttempts(prev => prev + 1);
    playTrySound();
    speakText("Great try! Let's keep trying together.");
  };

  const handleAction = (question: string, answer: string, success: boolean) => {
    const newAttempt = {
      question,
      answer,
      success,
      timestamp: new Date().toISOString()
    };
    setAttemptsHistory(prev => [...prev, newAttempt]);

    // Configure floating kids-friendly feedback text
    const successPhrases = ["Hurray! 🎉", "Yeahhh! 🌟", "Awesome! 🎈", "Brilliant! 🚀", "Superb! 🌈", "Wahoo! 🥳", "Great job! 🧸"];
    const failPhrases = ["Try again! 💪", "Boo... Let's try again! 🧸", "Keep trying! ❤️", "You can do it! 🌟", "Almost had it! 🌈"];

    const phrase = success
      ? successPhrases[Math.floor(Math.random() * successPhrases.length)]
      : failPhrases[Math.floor(Math.random() * failPhrases.length)];

    setFeedbackText(phrase);
    setFeedbackType(success ? "success" : "fail");

    // Clear overlay after 1.5 seconds
    setTimeout(() => {
      setFeedbackText("");
      setFeedbackType(null);
    }, 1500);

    // Track attempt sounds & speech
    if (!success) {
      setAttempts(prev => prev + 1);
      playTrySound();
      speakText("Great try! Let's keep trying together.");
    } else {
      speakText("You got it! Outstanding! 🎉");
    }
  };

  const handleComplete = (correctCount: number, incorrectCount: number, customStars?: number) => {
    if (isComplete) return;
    setIsComplete(true);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Default to 5 stars if neither customStars nor correctCount is valid
    let reward = 5;
    if (customStars !== undefined) {
      reward = customStars;
    } else if (correctCount > 0) {
      reward = correctCount;
    }

    setStarsAwarded(reward);

    // Reward stars
    addStars(reward);

    // If attemptsHistory is empty, synthesize fallbacks based on correct/incorrect counts
    let finalAttemptsHistory = [...attemptsHistory];
    if (finalAttemptsHistory.length === 0) {
      const startMs = startTime;
      for (let i = 0; i < incorrectCount; i++) {
        finalAttemptsHistory.push({
          question: `Challenge Task ${i + 1}`,
          answer: "Incorrect attempt",
          success: false,
          timestamp: new Date(startMs + i * 1000).toISOString()
        });
      }
      for (let i = 0; i < correctCount; i++) {
        finalAttemptsHistory.push({
          question: `Challenge Task ${incorrectCount + i + 1}`,
          answer: "Correct answer",
          success: true,
          timestamp: new Date(startMs + (incorrectCount + i) * 1000).toISOString()
        });
      }
    }

    // Save analytics log
    recordActivity({
      startTime: new Date(startTime).toISOString(),
      finishTime: new Date(endTime).toISOString(),
      duration,
      attempts: finalAttemptsHistory.length || attempts || 1,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      hintsUsed,
      completionRate: 100,
      rewardEarned: `⭐ ${reward} Stars`,
      attemptsHistory: finalAttemptsHistory
    });

    // Challenge Completion Logic
    const activeChallengeId = localStorage.getItem("active_challenge_id");
    const challengeSenderScore = localStorage.getItem("active_challenge_sender_score");
    const challengeSenderName = localStorage.getItem("active_challenge_sender_name");
    
    if (activeChallengeId) {
      localStorage.removeItem("active_challenge_id");
      localStorage.removeItem("active_challenge_sender_score");
      localStorage.removeItem("active_challenge_sender_name");
      
      LocalDB.completeChallenge(activeChallengeId, correctCount);
      
      const targetScore = challengeSenderScore ? parseInt(challengeSenderScore, 10) : 0;
      if (correctCount >= targetScore) {
        speakText(`Woohoo! You beat ${challengeSenderName || "your friend"}'s challenge score of ${targetScore}! You got ${correctCount} correct answers! 🎉`);
        alert(`🏆 Challenge Completed!\nYou beat ${challengeSenderName}'s score of ${targetScore} with a score of ${correctCount}! 🎉`);
      } else {
        speakText(`Nice try! You scored ${correctCount}, but ${challengeSenderName || "your friend"}'s score was ${targetScore}. You can try again! 😊`);
        alert(`🧸 Nice Try!\nYou scored ${correctCount}. ${challengeSenderName}'s score is ${targetScore}. Keep practicing to beat it!`);
      }
    }

    // Run celebration
    playWinSound();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (isReplaying) {
      speakText(`Awesome! You completed this game again and earned ${reward} more stars!`);
    } else {
      speakText(`Splendid job! You finished the game and earned ${reward} stars!`);
    }
  };

  const handleReadGameTitle = () => {
    speakText(`Game Name: ${currentPlayingGame.title}`);
  };

  return (
    <div className="container animate-slide-up" style={{ minHeight: "100vh", padding: "12px 8px 30px" }}>
      
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "10px"
        }}
      >
        <button
          onClick={() => setPlayingGame(null)}
          className="btn btn-gray"
          style={{
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            padding: 0,
            boxShadow: "none"
          }}
          aria-label="Go Back"
        >
          <ArrowLeft size={24} />
        </button>

        <h2
          onClick={handleReadGameTitle}
          style={{
            fontSize: "1.1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--text-primary)"
          }}
        >
          {currentPlayingGame.title}
          <Volume2 size={18} color="var(--accent-secondary)" />
        </h2>

        <div style={{ width: "50px" }}></div> {/* balance header spacer */}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Sandbox
          htmlContent={currentPlayingGame.htmlContent}
          onComplete={handleComplete}
          onAttempt={handleAttempt}
          onAction={handleAction}
        />
      </div>

      {/* Success Modal Reward Overlay */}
      {isComplete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 10000
          }}
        >
          <div
            className="play-card animate-pop-in"
            style={{
              width: "100%",
              maxWidth: "400px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "40px 24px",
              border: "4px solid var(--success)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "var(--success)",
                color: "#fff",
                borderRadius: "50%",
                width: "70px",
                height: "70px",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                boxShadow: "0 8px 20px rgba(16, 185, 129, 0.3)"
              }}
            >
              <Smile size={42} />
            </div>

            <div>
              <h2 style={{ fontSize: "1.7rem", color: "var(--success)", marginBottom: "8px" }}>
                😊 Great job!
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "var(--text-primary)",
                  fontWeight: "600",
                  lineHeight: "1.5"
                }}
              >
                Let's celebrate! You solved the activity successfully.
              </p>
            </div>

            {/* Reward visualization */}
            <div
              style={{
                backgroundColor: "#fef9c3",
                border: "2px solid #facc15",
                borderRadius: "20px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                margin: "0 20px"
              }}
            >
              <div style={{ display: "flex", gap: "2px" }}>
                {[...Array(Math.max(1, Math.min(starsAwarded, 5)))].map((_, i) => (
                  <Star key={i} size={28} fill="#facc15" color="#eab308" />
                ))}
              </div>
              <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "#854d0e" }}>
                +{starsAwarded} Stars!
              </span>
            </div>

            <button
              onClick={() => setPlayingGame(null)}
              className="btn btn-success"
              style={{ width: "100%", padding: "18px", fontSize: "1.2rem" }}
            >
              Play Next Game
              <Sparkles size={20} />
            </button>
          </div>
        </div>
      )}
      {/* Absolute floating keyframe micro-animations overlay for visual action feedback */}
      {feedbackText && (
        <div
          style={{
            position: "fixed",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: feedbackType === "success" ? "#10b981" : "#ef4444",
            color: "#ffffff",
            padding: "16px 36px",
            borderRadius: "30px",
            fontSize: "2.3rem",
            fontWeight: "900",
            zIndex: 99999,
            pointerEvents: "none",
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
            border: "4px solid #ffffff",
            animation: "floatUpAndFade 1.5s ease-out forwards",
            textAlign: "center",
            whiteSpace: "nowrap"
          }}
        >
          {feedbackText}
        </div>
      )}

      <style>{`
        @keyframes floatUpAndFade {
          0% {
            opacity: 0;
            transform: translate(-50%, -30%) scale(0.5);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
          }
          30% {
            transform: translate(-50%, -50%) scale(1.0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -55%) scale(1.0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -65%) scale(0.85);
          }
        }
      `}</style>
    </div>
  );
};
export default GamePlayer;
