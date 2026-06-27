import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
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
  const [starsAwarded] = useState(5);
  const [isLoadingGame, setIsLoadingGame] = useState(true);

  useEffect(() => {
    if (currentPlayingGame) {
      setIsLoadingGame(true);
      const timer = setTimeout(() => {
        setIsLoadingGame(false);
        setStartTime(Date.now());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayingGame]);

  useEffect(() => {
    if (currentPlayingGame && !isLoadingGame) {
      speakText(`Let's play ${currentPlayingGame.title}. Answer the question on the screen!`);
    }
  }, [currentPlayingGame, isLoadingGame]);

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

  const handleComplete = (correctCount: number, incorrectCount: number) => {
    if (isComplete) return;
    setIsComplete(true);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Reward stars
    addStars(starsAwarded);

    // Save analytics log
    recordActivity({
      startTime: new Date(startTime).toISOString(),
      finishTime: new Date(endTime).toISOString(),
      duration,
      attempts: attempts + 1,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      hintsUsed,
      completionRate: 100,
      rewardEarned: `⭐ ${starsAwarded} Stars`
    });

    // Run celebration
    playWinSound();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    speakText(`Splendid job! You finished the game and earned ${starsAwarded} stars!`);
  };

  const handleReadGameTitle = () => {
    speakText(`Game Name: ${currentPlayingGame.title}`);
  };

  return (
    <div className="container animate-slide-up" style={{ minHeight: "100vh", padding: "16px" }}>
      
      {/* Header controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
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

      {/* Sandbox Game Display */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Sandbox
          htmlContent={currentPlayingGame.htmlContent}
          onComplete={handleComplete}
          onAttempt={handleAttempt}
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
                {[...Array(3)].map((_, i) => (
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
    </div>
  );
};
export default GamePlayer;
