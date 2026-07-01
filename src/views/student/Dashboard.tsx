import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, FriendRequest, Student, Challenge } from "../../services/db";
import { Trophy, Play, Lock, Send } from "lucide-react";
import { SUBJECTS } from "../../utils/constants";
import { AvatarIcon } from "../../components/AvatarIcon";
import { StarBadge } from "../../components/StarBadge";
import { StreakBadge } from "../../components/StreakBadge";
import { PlayCard } from "../../components/PlayCard";
import KidsLoader from "../../components/KidsLoader";

const DIFFICULTY_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bg: string }> = {
  Easy: { symbol: "🌱", label: "Seedling", color: "#15803d", bg: "#d1fae5" },
  Medium: { symbol: "🌿", label: "Sapling", color: "#c2410c", bg: "#ffedd5" },
  Hard: { symbol: "🌳", label: "Big Tree", color: "#b91c1c", bg: "#fee2e2" }
};

const parseGameTitle = (fullTitle: string) => {
  const emojiRegex = /^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2000}-\u{3300}])/u;
  const trimmed = fullTitle.trim();
  const match = trimmed.match(emojiRegex);
  if (match) {
    const emoji = match[1];
    const rest = trimmed.substring(emoji.length).trim();
    return { emoji, cleanTitle: rest };
  }
  return { emoji: "🎮", cleanTitle: trimmed };
};

const isPremium = (student: Student | null) => {
  if (!student) return false;
  if (student.tier === "paid") return true;
  if (student.trialUntil && new Date() < new Date(student.trialUntil)) return true;
  return false;
};

export const Dashboard: React.FC = () => {
  const { currentStudent, updateStudent, setPlayingGame, installPrompt, triggerInstall, notiPermission, requestNotiPermission, speakText } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [completedGames, setCompletedGames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(LocalDB.getCachedGames().length === 0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [visibleGameCount, setVisibleGameCount] = useState(10);

  // Modals & game requests states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestIdeaText, setRequestIdeaText] = useState("");
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedGameTitle, setLockedGameTitle] = useState("");
  const [lockedReason, setLockedReason] = useState<"premium" | "stars">("premium");
  const [lockedStarsRequired, setLockedStarsRequired] = useState(0);
  const [showIdeaSuccess, setShowIdeaSuccess] = useState(false);

  // Social/Friends Hub states
  const [activeTab, setActiveTab] = useState<"games" | "friends">("games");
  const [friendPhone, setFriendPhone] = useState("");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsList, setFriendsList] = useState<Student[]>([]);
  const [friendLogs, setFriendLogs] = useState<Record<string, ActivityLog[]>>({});
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);
  const [isSearchingFriend, setIsSearchingFriend] = useState(false);
  const [socialError, setSocialError] = useState("");
  const [socialSuccess, setSocialSuccess] = useState("");
  const [showFrogModal, setShowFrogModal] = useState(false);

  // Challenge & Flexing States
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myHighscores, setMyHighscores] = useState<{ gameId: string; title: string; maxCorrect: number }[]>([]);
  const [activeFlexGame, setActiveFlexGame] = useState<{ gameId: string; title: string; score: number } | null>(null);
  const [showFlexModal, setShowFlexModal] = useState(false);
  const [activeChallengeFriend, setActiveChallengeFriend] = useState<Student | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showTrialPopup, setShowTrialPopup] = useState(false);

  useEffect(() => {
    if (currentStudent && !currentStudent.trialUntil && currentStudent.tier !== "paid") {
      setShowTrialPopup(true);
      speakText(`Hi ${currentStudent.name}! You have a free 7-day premium trial waiting for you! Tap to activate!`);
    }
  }, [currentStudent]);

  const handleActivateTrial = async () => {
    if (!currentStudent) return;
    try {
      const trialUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const updated: Student = {
        ...currentStudent,
        trialUntil
      };
      await updateStudent(updated);
      setShowTrialPopup(false);
      speakText("Hooray! Your 7-day premium trial is now active! Go explore challenges and friends progress!");
      setSocialSuccess("Hooray! Premium Trial Activated for 7 days! 💎");
      setTimeout(() => setSocialSuccess(""), 4000);
      fetchSocialData();
    } catch (err) {
      console.error("Failed to activate trial:", err);
      setSocialError("Failed to activate trial. Please try again.");
    }
  };

  const fetchSocialData = async () => {
    if (!currentStudent) return;
    try {
      const requests = await LocalDB.getFriendRequests(currentStudent.id);
      setFriendRequests(requests);

      // Find accepted friendships
      const acceptedRequests = requests.filter(r => r.status === "accepted");
      const friendIds = Array.from(new Set(
        acceptedRequests.map(r => r.senderId === currentStudent.id ? r.receiverId : r.senderId)
      ));

      // Fetch student details for all friends
      const friendsDetails = await Promise.all(
        friendIds.map(id => LocalDB.getStudent(id))
      );
      // Filter out undefined
      const validFriends = friendsDetails.filter((s): s is Student => !!s);
      setFriendsList(validFriends);

      // Fetch logs of friends if current student is premium
      if (isPremium(currentStudent)) {
        const logsMap: Record<string, ActivityLog[]> = {};
        await Promise.all(
          validFriends.map(async (friend) => {
            const logs = await LocalDB.getStudentLogs(friend.id);
            logsMap[friend.id] = logs;
          })
        );
        setFriendLogs(logsMap);

        // Fetch own logs & compute highscores
        const myLogs = await LocalDB.getStudentLogs(currentStudent.id);
        const myHighscoresMap: Record<string, { gameId: string; title: string; maxCorrect: number }> = {};
        myLogs.forEach(log => {
          if (!myHighscoresMap[log.gameId]) {
            myHighscoresMap[log.gameId] = {
              gameId: log.gameId,
              title: log.gameTitle,
              maxCorrect: log.correctAnswers
            };
          } else {
            myHighscoresMap[log.gameId].maxCorrect = Math.max(myHighscoresMap[log.gameId].maxCorrect, log.correctAnswers);
          }
        });
        setMyHighscores(Object.values(myHighscoresMap));

        // Fetch challenges
        const challs = await LocalDB.getChallenges(currentStudent.id);
        setChallenges(challs);
      }
    } catch (err) {
      console.warn("Failed to fetch social data:", err);
    }
  };

  useEffect(() => {
    if (currentStudent) {
      fetchSocialData();
    }
  }, [currentStudent]);

  const handleUpgradeToPremium = () => {
    speakText("Ribbit! Ask your parents to call Frog Uncle at +91 9871229599 to unlock premium features!");
    setShowFrogModal(true);
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    if (!isPremium(currentStudent)) {
      setSocialError("Only Premium/Paid users can send friend requests!");
      speakText("Ask your parent to upgrade your account to send friend requests!");
      return;
    }

    const targetPhone = friendPhone.trim();
    if (!targetPhone) {
      setSocialError("Please enter a valid phone number!");
      return;
    }

    if (targetPhone === currentStudent.phone) {
      setSocialError("You cannot send a friend request to yourself!");
      speakText("You cannot send a request to your own number!");
      return;
    }

    setIsSearchingFriend(true);
    setSocialError("");
    setSocialSuccess("");

    try {
      const targetStudent = await LocalDB.getStudentByPhone(targetPhone);
      if (!targetStudent) {
        setSocialError("No student registered with this parent's phone number!");
        speakText("We couldn't find a friend with that phone number.");
        setIsSearchingFriend(false);
        return;
      }

      if (targetStudent.id === currentStudent.id) {
        setSocialError("You cannot send a friend request to yourself!");
        speakText("You cannot send a request to your own profile.");
        setIsSearchingFriend(false);
        return;
      }

      // Check if request already exists
      const existingRequests = await LocalDB.getFriendRequests(currentStudent.id);
      const duplicate = existingRequests.find(r => 
        (r.senderId === currentStudent.id && r.receiverId === targetStudent.id) ||
        (r.senderId === targetStudent.id && r.receiverId === currentStudent.id)
      );

      if (duplicate) {
        if (duplicate.status === "accepted") {
          setSocialError(`You are already friends with ${targetStudent.name}!`);
          speakText(`You are already friends with ${targetStudent.name}!`);
        } else {
          setSocialError(`A pending request already exists with ${targetStudent.name}!`);
          speakText(`A friend request is already pending with ${targetStudent.name}.`);
        }
        setIsSearchingFriend(false);
        return;
      }

      await LocalDB.sendFriendRequest(currentStudent, targetStudent);
      setSocialSuccess(`Yay! Friend request sent to ${targetStudent.name}! 🚀`);
      speakText(`Friend request sent to ${targetStudent.name}!`);
      setFriendPhone("");
      fetchSocialData();
    } catch (err) {
      console.error("Failed to send friend request:", err);
      setSocialError("Oops, something went wrong sending the request.");
    } finally {
      setIsSearchingFriend(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderName: string) => {
    try {
      await LocalDB.acceptFriendRequest(requestId);
      setSocialSuccess(`Awesome! You accepted ${senderName}'s request!`);
      speakText(`You are now friends with ${senderName}!`);
      fetchSocialData();
    } catch (err) {
      console.error("Failed to accept request:", err);
      setSocialError("Failed to accept friend request.");
    }
  };

  const handleDeclineRequest = async (requestId: string, name: string, isFriend: boolean = false) => {
    try {
      await LocalDB.deleteFriendRequest(requestId);
      if (isFriend) {
        setSocialSuccess(`Removed ${name} from friends.`);
        speakText(`Removed ${name} from your friends list.`);
      } else {
        setSocialSuccess(`Declined request from ${name}.`);
        speakText(`Declined request.`);
      }
      fetchSocialData();
      if (expandedFriendId === name) setExpandedFriendId(null);
    } catch (err) {
      console.error("Failed to delete request:", err);
      setSocialError("Failed to perform action.");
    }
  };

  const handleFlexScore = async (friendId: string, friendName: string) => {
    if (!currentStudent || !activeFlexGame) return;
    try {
      const flexId = "flex_" + Math.random().toString(36).substr(2, 9);
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
      setSocialSuccess(`Flexed your score of ${activeFlexGame.score} in ${activeFlexGame.title} with ${friendName}! 💪`);
      speakText(`Flexed your score with ${friendName}!`);
      setShowFlexModal(false);
      fetchSocialData();
    } catch (err) {
      console.error("Failed to flex score:", err);
      setSocialError("Failed to flex score with friend.");
    }
  };

  const handleSendChallenge = async (gameId: string, gameTitle: string) => {
    if (!currentStudent || !activeChallengeFriend) return;
    
    // Find own highscore
    const ownScore = myHighscores.find(hs => hs.gameId === gameId)?.maxCorrect || 0;

    try {
      const challengeId = "chall_" + Math.random().toString(36).substr(2, 9);
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
      setSocialSuccess(`Challenged ${activeChallengeFriend.name} to play ${gameTitle}! ⚔️`);
      speakText(`Challenged ${activeChallengeFriend.name} to a game!`);
      setShowChallengeModal(false);
      fetchSocialData();
    } catch (err) {
      console.error("Failed to send challenge:", err);
      setSocialError("Failed to send challenge to friend.");
    }
  };

  const handlePlayChallenge = (challenge: Challenge) => {
    const game = games.find(g => g.id === challenge.gameId);
    if (!game) {
      alert("Oops! This game is not currently available or published.");
      return;
    }
    localStorage.setItem("active_challenge_id", challenge.id);
    localStorage.setItem("active_challenge_sender_score", challenge.senderScore.toString());
    localStorage.setItem("active_challenge_sender_name", challenge.senderName);
    setPlayingGame(game);
  };

  const handleDismissChallenge = async (challengeId: string) => {
    try {
      await LocalDB.deleteChallenge(challengeId);
      setSocialSuccess("Notification cleared.");
      fetchSocialData();
    } catch (err) {
      console.error("Failed to clear notification:", err);
    }
  };

  const handleVoteGame = async (game: Game, type: "like" | "dislike") => {
    if (!currentStudent) return;
    try {
      const studentId = currentStudent.id;
      let likes = game.likes || [];
      let dislikes = game.dislikes || [];

      if (type === "like") {
        if (likes.includes(studentId)) {
          likes = likes.filter(id => id !== studentId);
        } else {
          likes = [...likes, studentId];
          dislikes = dislikes.filter(id => id !== studentId);
        }
      } else {
        if (dislikes.includes(studentId)) {
          dislikes = dislikes.filter(id => id !== studentId);
        } else {
          dislikes = [...dislikes, studentId];
          likes = likes.filter(id => id !== studentId);
        }
      }

      const updatedGame: Game = {
        ...game,
        likes,
        dislikes
      };

      await LocalDB.saveGame(updatedGame);
      setGames(prev => prev.map(g => g.id === game.id ? updatedGame : g));
      speakText(type === "like" ? "You liked this activity! 👍" : "You disliked this activity. 👎");
    } catch (err) {
      console.error("Failed to cast vote:", err);
    }
  };

  useEffect(() => {
    // 1. Helper to render games & logs from a given data set
    const renderGamesAndLogs = (allGames: Game[], allLogs: ActivityLog[]) => {
      const list = allGames.filter(g => {
        // 1. If assigned to a specific student, verify it matches
        if (g.assignedStudentId && g.assignedStudentId !== currentStudent?.id) {
          return false;
        }

        // 2. Class check: if game has target class(es), student class must match one of them
        if (g.class && g.class.trim() !== "") {
          const targetClasses = g.class.split(",").map(c => c.trim().toLowerCase());
          const studentClassClean = currentStudent?.class?.trim().toLowerCase();
          return !!studentClassClean && targetClasses.includes(studentClassClean);
        }

        // 3. No Class game will be visible to all
        return true;
      });

      // Build completed games lookup map for current student
      const completedMap: Record<string, string> = {};
      if (currentStudent) {
        const studentLogs = allLogs.filter(l => l.studentId === currentStudent.id);
        const gameStars: Record<string, number> = {};
        studentLogs.forEach(log => {
          if (log.completionRate === 100) {
            let stars = 0;
            if (log.rewardEarned) {
              const match = log.rewardEarned.match(/(\d+)/);
              if (match) {
                stars = parseInt(match[1], 10);
              } else if (log.rewardEarned.includes("Star")) {
                stars = 1;
              }
            } else {
              stars = 5; // Default completion reward fallback
            }
            gameStars[log.gameId] = (gameStars[log.gameId] || 0) + stars;
          }
        });
        
        Object.keys(gameStars).forEach(gameId => {
          completedMap[gameId] = `⭐ ${gameStars[gameId]} Stars`;
        });
        setCompletedGames(completedMap);
      }

      // Sort: Unlocked & Uncompleted first, then Unlocked & Completed, then Locked/Upcoming
      const sorted = [...list].sort((a, b) => {
        const aPremiumLocked = a.isFree === false && currentStudent?.tier !== "paid";
        const aStarLocked = a.starsRequired ? (currentStudent?.stars || 0) < a.starsRequired : false;
        const aLocked = aPremiumLocked || aStarLocked;

        const bPremiumLocked = b.isFree === false && currentStudent?.tier !== "paid";
        const bStarLocked = b.starsRequired ? (currentStudent?.stars || 0) < b.starsRequired : false;
        const bLocked = bPremiumLocked || bStarLocked;

        const aCompleted = !!completedMap[a.id];
        const bCompleted = !!completedMap[b.id];

        // Determine category weights (lower weight = higher display priority)
        let aWeight = 1; // Unlocked & Uncompleted
        if (aLocked) {
          aWeight = 3; // Locked/Upcoming
        } else if (aCompleted) {
          aWeight = 2; // Unlocked & Completed
        }

        let bWeight = 1; // Unlocked & Uncompleted
        if (bLocked) {
          bWeight = 3; // Locked/Upcoming
        } else if (bCompleted) {
          bWeight = 2; // Unlocked & Completed
        }

        if (aWeight !== bWeight) {
          return aWeight - bWeight;
        }

        // If they are in the same category, tie-breaker:
        if (aLocked && bLocked) {
          // Locked games sort by starsRequired ascending (e.g. 300, then 400, then 500...)
          const aStars = a.starsRequired !== undefined ? a.starsRequired : 999999;
          const bStars = b.starsRequired !== undefined ? b.starsRequired : 999999;
          if (aStars !== bStars) {
            return aStars - bStars;
          }
        }

        // Otherwise, sort by Custom Admin Ordering
        const aOrder = a.order !== undefined ? a.order : 99999;
        const bOrder = b.order !== undefined ? b.order : 99999;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Tertiary sort: Newest first
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setGames(sorted);
    };

    // 2. Synchronous Immediate load from local storage cache
    const cachedGames = LocalDB.getCachedGames();
    const cachedLogs = LocalDB.getCachedLogs();

    // If we have cached games, show them immediately! If not, wait for network or local fallback
    if (cachedGames.length > 0) {
      renderGamesAndLogs(cachedGames, cachedLogs);
    }

    // 3. Background Revalidation (check internet & refresh from Firestore)
    const fetchFreshData = async () => {
      try {
        const [freshGames, freshLogs] = await Promise.all([
          LocalDB.getGames(),
          LocalDB.getLogs()
        ]);

        // Update states silently in the background
        renderGamesAndLogs(freshGames, freshLogs);
      } catch (err) {
        console.warn("Background revalidation failed (offline/error):", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreshData();
  }, [currentStudent]);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near the bottom of the window
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 150
      ) {
        setVisibleGameCount(prev => prev + 10);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStudentLogOut = () => {
    localStorage.removeItem("active_student_id");
    // Reload page or update view to reset state
    window.location.reload();
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestIdeaText.trim()) return;

    setIsSubmittingIdea(true);
    try {
      const ideaId = "req_" + Date.now();
      const newRequest = {
        id: ideaId,
        studentId: currentStudent?.id || "guest",
        studentName: currentStudent?.name || "Guest Student",
        idea: requestIdeaText.trim(),
        createdAt: new Date().toISOString()
      };

      await LocalDB.saveGameRequest(newRequest);
      speakText("Idea sent! Thank you for sharing your suggestion!");
      setRequestIdeaText("");
      setShowRequestModal(false);
      setShowIdeaSuccess(true);
    } catch (err) {
      console.error("Failed to save student request:", err);
      alert("Oops! Failed to submit your idea. Try again!");
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  const isNew = (createdAtString?: string) => {
    if (!createdAtString) return false;
    try {
      const createdTime = new Date(createdAtString).getTime();
      const currentTime = new Date().getTime();
      const diffHours = (currentTime - createdTime) / (1000 * 60 * 60);
      return diffHours < 24; // Show "NEW" tag if created in the last 24 hours
    } catch (e) {
      return false;
    }
  };

  // Check student validity expiration
  const isExpired = currentStudent?.validUntil && new Date() > new Date(currentStudent.validUntil);

  if (isExpired && currentStudent) {
    return (
      <div className="container animate-slide-up" style={{ justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <PlayCard
          style={{
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            padding: "40px 24px",
            border: "4px solid var(--accent-primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px"
          }}
        >
          <div style={{ fontSize: "4.5rem" }}>⏰</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--text-primary)", margin: 0 }}>
            Time to Renew! 🌟
          </h2>
          <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "1.05rem", margin: 0, lineHeight: "1.5" }}>
            Hi {currentStudent.name}! Your learning dashboard validity has ended.
            Please ask your parents or teacher to renew it so you can keep playing and earning stars!
          </p>

          <div
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "2px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "16px",
              width: "100%",
              fontSize: "0.95rem",
              textAlign: "left"
            }}
          >
            <p style={{ margin: "4px 0" }}><strong>Registered Phone:</strong> {currentStudent.phone || "N/A"}</p>
            <p style={{ margin: "4px 0" }}><strong>Student ID:</strong> <span style={{ fontFamily: "monospace" }}>{currentStudent.id}</span></p>
          </div>

          <button
            onClick={handleStudentLogOut}
            className="btn"
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "1rem",
              backgroundColor: "#fee2e2",
              border: "2px solid #fca5a5",
              color: "#b91c1c",
              borderRadius: "12px",
              fontWeight: "800",
              cursor: "pointer"
            }}
          >
            🚪 Change Account
          </button>
        </PlayCard>
      </div>
    );
  }

  if (isLoading) {
    return <KidsLoader />;
  }

  return (
    <div className="container animate-slide-up">
      {/* Student Profile Header using Reusable PlayCard, AvatarIcon, StarBadge and StreakBadge */}
      <PlayCard
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "16px 20px",
          marginBottom: "20px",
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "6px solid var(--accent-secondary)",
          borderTop: 0,
          borderLeft: 0,
          borderRight: 0,
          borderRadius: "var(--border-radius)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {currentStudent && <AvatarIcon avatarId={currentStudent.avatar} size="md" />}
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
              Hi, {currentStudent?.name || "Student"}!
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>Student Account</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: isPremium(currentStudent) ? "#e0f2fe" : "#f1f5f9",
                  color: isPremium(currentStudent) ? "#0369a1" : "#475569",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontWeight: "900",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  border: isPremium(currentStudent) ? "1.5px solid #bae6fd" : "1.5px solid #cbd5e1"
                }}
              >
                {isPremium(currentStudent) ? "💎 Premium" : "🆓 Free"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <StarBadge count={currentStudent?.stars || 0} />
          <StreakBadge days={currentStudent?.streak || 1} />
        </div>
      </PlayCard>

      {/* Segmented Tab Controller for Games vs Friends */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#f1f5f9",
          borderRadius: "16px",
          padding: "6px",
          marginBottom: "20px",
          border: "2px solid #cbd5e1"
        }}
      >
        <button
          onClick={() => setActiveTab("games")}
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: "1.05rem",
            fontWeight: "800",
            borderRadius: "12px",
            border: "none",
            backgroundColor: activeTab === "games" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "games" ? "#ffffff" : "#475569",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "games" ? "0 4px 6px rgba(79, 70, 229, 0.2)" : "none"
          }}
        >
          🎮 Play Games
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: "1.05rem",
            fontWeight: "800",
            borderRadius: "12px",
            border: "none",
            backgroundColor: activeTab === "friends" ? "var(--accent-primary)" : "transparent",
            color: activeTab === "friends" ? "#ffffff" : "#475569",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: activeTab === "friends" ? "0 4px 6px rgba(79, 70, 229, 0.2)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <span>🤝 Friends Hub</span>
          {friendRequests.filter(r => r.receiverId === currentStudent?.id && r.status === "pending").length > 0 && (
            <span
              style={{
                backgroundColor: "#ef4444",
                color: "#ffffff",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900"
              }}
            >
              {friendRequests.filter(r => r.receiverId === currentStudent?.id && r.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "games" && (
        <>
          {/* Custom Add to Homescreen install prompt for PWA support */}
          {installPrompt && (
        <PlayCard
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "12px 18px",
            backgroundColor: "#e0f2fe",
            borderColor: "#38bdf8",
            borderWidth: "2.5px",
            borderStyle: "solid",
            marginBottom: "20px",
            borderRadius: "16px",
            boxShadow: "0 4px 0 #0284c7"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>📱</span>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#0369a1" }}>Install app on your phone!</strong>
              <span style={{ fontSize: "0.8rem", color: "#0284c7" }}>Play games faster from your homescreen!</span>
            </div>
          </div>
          <button
            onClick={triggerInstall}
            className="btn"
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--accent-secondary)",
              color: "#ffffff",
              fontSize: "0.85rem",
              borderRadius: "10px",
              fontWeight: "800",
              boxShadow: "0 3px 0 #0284c7",
              border: "none",
              cursor: "pointer"
            }}
          >
            📥 Install
          </button>
        </PlayCard>
      )}

      {/* Custom PWA Push Notification permission prompt banner */}
      {notiPermission === "default" && (
        <PlayCard
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "12px 18px",
            backgroundColor: "#fef2f2",
            borderColor: "#fca5a5",
            borderWidth: "2.5px",
            borderStyle: "solid",
            marginBottom: "20px",
            borderRadius: "16px",
            boxShadow: "0 4px 0 #ef4444"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>🔔</span>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block", fontSize: "0.95rem", color: "#991b1b" }}>Turn on Game Alerts!</strong>
              <span style={{ fontSize: "0.85rem", color: "#b91c1c" }}>Get notified when new games are ready to play! ✨</span>
            </div>
          </div>
          <button
            onClick={requestNotiPermission}
            className="btn"
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--accent-primary)",
              color: "#ffffff",
              fontSize: "0.85rem",
              borderRadius: "10px",
              fontWeight: "800",
              boxShadow: "0 3px 0 #b91c1c",
              border: "none",
              cursor: "pointer"
            }}
          >
            Alert Me!
          </button>
        </PlayCard>
      )}

      {/* Subject Selector using Reusable PlayCard */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${SUBJECTS.filter(s => s.enabled).length}, 1fr)`, gap: "12px", marginBottom: "24px" }}>
        {SUBJECTS.filter(s => s.enabled).map(subject => (
          <PlayCard
            key={subject.id}
            onClick={() => setSelectedSubject(subject.id)}
            style={{
              backgroundColor: subject.color,
              borderColor: selectedSubject === subject.id ? "var(--text-primary)" : subject.border,
              borderWidth: "3px",
              borderStyle: selectedSubject === subject.id ? "solid" : "dashed",
              cursor: "pointer",
              padding: "16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1e293b" }}>
              {subject.title}
            </span>
          </PlayCard>
        ))}
      </div>

      {/* Games List for Subject with list/grid toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", margin: 0 }}>
          Choose a Game:
        </h3>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              borderRadius: "10px",
              border: "2px solid #cbd5e1",
              backgroundColor: viewMode === "list" ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: viewMode === "list" ? "#ffffff" : "var(--text-primary)",
              fontWeight: "800",
              cursor: "pointer"
            }}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              borderRadius: "10px",
              border: "2px solid #cbd5e1",
              backgroundColor: viewMode === "grid" ? "var(--accent-primary)" : "var(--bg-secondary)",
              color: viewMode === "grid" ? "#ffffff" : "var(--text-primary)",
              fontWeight: "800",
              cursor: "pointer"
            }}
          >
            🎛️ Grid
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {games.length === 0 ? (
          <PlayCard style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed #cbd5e1" }}>
            <Trophy size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
            <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              No games published yet. Wait for your teacher to create some! 😊
            </p>
          </PlayCard>
        ) : (
          <div
            style={
              viewMode === "list"
                ? { display: "flex", flexDirection: "column", gap: "16px" }
                : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }
            }
          >
            {games.slice(0, visibleGameCount).map(game => {
              const { emoji, cleanTitle } = parseGameTitle(game.title);
              const isPremiumLocked = game.isFree === false && !isPremium(currentStudent);
              const isStarLocked = game.starsRequired ? (currentStudent?.stars || 0) < game.starsRequired : false;
              const isGameLocked = isPremiumLocked || isStarLocked;
              return (
                <PlayCard
                  key={game.id}
                  onClick={() => {
                    if (isGameLocked) {
                      if (isStarLocked) {
                        speakText(`Ooh! You need ${game.starsRequired} Stars to play ${cleanTitle}! You currently have ${currentStudent?.stars || 0} stars. Keep playing to earn more!`);
                        setLockedGameTitle(cleanTitle);
                        setLockedReason("stars");
                        setLockedStarsRequired(game.starsRequired || 0);
                        setShowLockModal(true);
                      } else {
                        speakText(`Ooh! ${cleanTitle} is a premium game! Ask your teacher or parent to unlock it.`);
                        setLockedGameTitle(cleanTitle);
                        setLockedReason("premium");
                        setShowLockModal(true);
                      }
                    } else {
                      setPlayingGame(game);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: viewMode === "list" ? "row" : "column",
                    alignItems: viewMode === "list" ? "center" : "stretch",
                    backgroundColor: completedGames[game.id] ? "#f0fdf4" : "var(--bg-secondary)",
                    borderColor: completedGames[game.id] ? "#86efac" : "#e2e8f0",
                    borderWidth: "3px",
                    borderStyle: "solid",
                    boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                    padding: viewMode === "list" ? "16px 20px" : "20px 16px",
                    gap: "16px",
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  {/* Premium / Star Lock Overlay Badge */}
                  {isGameLocked && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: isStarLocked ? "12px" : "50%",
                        padding: isStarLocked ? "4px 8px" : "0",
                        height: isStarLocked ? "auto" : "30px",
                        minWidth: isStarLocked ? "auto" : "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 8px rgba(239, 68, 68, 0.4)",
                        border: "2.5px solid white",
                        fontSize: isStarLocked ? "0.7rem" : "inherit",
                        fontWeight: "900",
                        zIndex: 5
                      }}
                      title={isStarLocked ? `Requires ${game.starsRequired} Stars` : "Premium Game"}
                    >
                      {isStarLocked ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap" }}>
                          🔒 {game.starsRequired} ⭐
                        </span>
                      ) : (
                        <Lock size={12} fill="white" />
                      )}
                    </div>
                  )}

                  {/* Big Game Logo */}
                  <div
                    style={{
                      fontSize: viewMode === "list" ? "2.2rem" : "2.8rem",
                      width: viewMode === "list" ? "60px" : "80px",
                      height: viewMode === "list" ? "60px" : "80px",
                      minWidth: viewMode === "list" ? "60px" : "80px",
                      borderRadius: viewMode === "list" ? "16px" : "22px",
                      backgroundColor: completedGames[game.id] ? "#d1fae5" : "var(--bg-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.05)",
                      margin: viewMode === "list" ? "0" : "0 auto 8px auto",
                      alignSelf: "center"
                    }}
                  >
                    {emoji}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, textAlign: viewMode === "list" ? "left" : "center" }}>
                    <span
                      style={{
                        fontSize: viewMode === "list" ? "1.2rem" : "1.05rem",
                        fontWeight: "800",
                        display: "flex",
                        flexDirection: viewMode === "list" ? "row" : "column",
                        alignItems: "center",
                        justifyContent: viewMode === "list" ? "flex-start" : "center",
                        flexWrap: "wrap",
                        color: "var(--text-primary)",
                        wordSpacing: "0.1em",
                        lineHeight: "1.2"
                      }}
                    >
                      <span>{cleanTitle}</span>

                      {/* Preview Upcoming Game tag if game is not published */}
                      {!game.published && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: "#f59e0b",
                            color: "#ffffff",
                            padding: "2px 8px",
                            borderRadius: "8px",
                            fontWeight: "900",
                            letterSpacing: "0.05em",
                            marginLeft: viewMode === "list" ? "10px" : "0",
                            marginTop: viewMode === "list" ? "0" : "6px",
                            lineHeight: "1"
                          }}
                        >
                          Preview Upcoming Game
                        </span>
                      )}

                      {/* Animated NEW Tag for newly published games, hiding if completed */}
                      {isNew(game.createdAt) && !completedGames[game.id] && (
                        <span
                          className="animate-tag-pulse"
                          style={{
                            fontSize: "0.75rem",
                            backgroundColor: "#f43f5e",
                            color: "#ffffff",
                            padding: "2px 8px",
                            borderRadius: "8px",
                            fontWeight: "900",
                            letterSpacing: "0.05em",
                            marginLeft: viewMode === "list" ? "10px" : "0",
                            marginTop: viewMode === "list" ? "0" : "6px",
                            lineHeight: "1"
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: viewMode === "list" ? "flex-start" : "center" }}>
                      {(() => {
                        const diff = DIFFICULTY_SYMBOLS[game.difficulty] || DIFFICULTY_SYMBOLS.Easy;
                        return (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              backgroundColor: diff.bg,
                              color: diff.color,
                              padding: "4px 10px",
                              borderRadius: "10px",
                              fontWeight: "800",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <span>{diff.symbol}</span>
                            <span>{diff.label}</span>
                          </span>
                        );
                      })()}

                      {/* Completed star rewards indicator & Likes/Dislikes */}
                      {completedGames[game.id] && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              backgroundColor: "#d1fae5",
                              color: "#065f46",
                              padding: "4px 10px",
                              borderRadius: "10px",
                              fontWeight: "800",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Replay this activity to earn even more stars!"
                          >
                            {viewMode === "list" 
                              ? `✓ Done (${completedGames[game.id]}) • Replay! 🌟`
                              : `✓ Done (${completedGames[game.id]}) • Replay! 🌟`
                            }
                          </span>

                          {/* Vote buttons */}
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoteGame(game, "like");
                              }}
                              style={{
                                border: "none",
                                background: game.likes?.includes(currentStudent?.id || "") ? "#22c55e" : "#f1f5f9",
                                color: game.likes?.includes(currentStudent?.id || "") ? "#ffffff" : "#475569",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                fontWeight: "800",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                transition: "all 0.15s ease"
                              }}
                              title="Like this game!"
                            >
                              👍
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVoteGame(game, "dislike");
                              }}
                              style={{
                                border: "none",
                                background: game.dislikes?.includes(currentStudent?.id || "") ? "#ef4444" : "#f1f5f9",
                                color: game.dislikes?.includes(currentStudent?.id || "") ? "#ffffff" : "#475569",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                fontWeight: "800",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                transition: "all 0.15s ease"
                              }}
                              title="Dislike this game"
                            >
                              👎
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Premium Game badge indicator */}
                      {game.isFree === false && (
                        <span
                          style={{
                            fontSize: "0.8rem",
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            padding: "4px 10px",
                            borderRadius: "10px",
                            fontWeight: "800",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          💎 Premium
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: viewMode === "list" ? "flex-end" : "center",
                      alignItems: "center",
                      marginTop: viewMode === "list" ? 0 : "8px"
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: isGameLocked ? "#cbd5e1" : "var(--accent-primary)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isGameLocked ? "none" : "0 6px 12px rgba(79, 70, 229, 0.3)"
                      }}
                    >
                      {isGameLocked ? <Lock size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
                    </div>
                  </div>
                </PlayCard>
              );
            })}

            {/* Special "Ask for More / Idea Lightbulb" Tile Card */}
            <PlayCard
              onClick={() => {
                speakText("Do you want to share a game idea with your teacher? Tap here!");
                setShowRequestModal(true);
              }}
              style={{
                display: "flex",
                flexDirection: viewMode === "list" ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--accent-primary)",
                borderWidth: "3px",
                borderStyle: "dashed",
                boxShadow: "0 6px 0 rgba(0,0,0,0.05)",
                padding: "20px 16px",
                gap: "16px",
                cursor: "pointer",
                textAlign: "center",
                minHeight: viewMode === "list" ? "auto" : "180px"
              }}
            >
              <div
                style={{
                  fontSize: viewMode === "list" ? "2.2rem" : "2.8rem",
                  color: "var(--accent-primary)",
                  animation: "kids-wiggle 2.5s infinite ease-in-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: viewMode === "list" ? "60px" : "80px",
                  height: viewMode === "list" ? "60px" : "80px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(79, 70, 229, 0.1)"
                }}
              >
                💡
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                  Ask for More!
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Share your fun game idea with your teacher!
                </span>
              </div>
            </PlayCard>
          </div>
        )}
      </div>
      </>
      )}

      {/* Friends Hub Panel */}
      {activeTab === "friends" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Social Alert Banner (Error/Success messages) */}
          {(socialError || socialSuccess) && (
            <PlayCard
              style={{
                padding: "12px 18px",
                backgroundColor: socialError ? "#fef2f2" : "#f0fdf4",
                borderColor: socialError ? "#fca5a5" : "#86efac",
                borderWidth: "2.5px",
                borderStyle: "solid",
                borderRadius: "16px",
                boxShadow: `0 4px 0 ${socialError ? "#ef4444" : "#10b981"}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.5rem" }}>{socialError ? "⚠️" : "🎉"}</span>
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: socialError ? "#b91c1c" : "#15803d"
                  }}
                >
                  {socialError || socialSuccess}
                </span>
              </div>
            </PlayCard>
          )}

          {/* Premium Tier Status Card */}
          <PlayCard
            style={{
              padding: "20px",
              backgroundColor: "var(--bg-secondary)",
              borderColor: isPremium(currentStudent) ? "#cbd5e1" : "#fca5a5",
              borderWidth: "3px",
              borderStyle: isPremium(currentStudent) ? "solid" : "dashed",
              borderRadius: "20px",
              boxShadow: "0 6px 0 rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "2.5rem" }}>{isPremium(currentStudent) ? "💎" : "🆓"}</span>
                <div style={{ textAlign: "left" }}>
                  <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "900", color: "var(--text-primary)" }}>
                    Account Tier: {currentStudent?.tier === "paid" ? "Premium Learner" : (isPremium(currentStudent) ? "Premium Trial" : "Free Learner")}
                  </h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                    {isPremium(currentStudent)
                      ? (currentStudent?.tier === "paid"
                          ? "You have full access to send requests & view friends' game scores! 🚀"
                          : "Premium Trial active! Call Frog Uncle to extend! 🐸")
                      : "Upgrade to premium to send requests & see friends' highscores! ✨"}
                  </p>
                </div>
              </div>
              
              {currentStudent?.tier !== "paid" && (
                <button
                  onClick={handleUpgradeToPremium}
                  className="btn btn-success animate-tag-pulse"
                  style={{
                    padding: "10px 18px",
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    borderRadius: "12px",
                    boxShadow: "0 4px 0 #16a34a",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span>💎 Upgrade Now</span>
                </button>
              )}
            </div>
          </PlayCard>

          {/* Add Friend Panel */}
          <PlayCard style={{ padding: "20px", borderRadius: "20px" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "1.1rem", fontWeight: "900", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>➕ Add a Buddy</span>
            </h4>
            
            <form onSubmit={handleSendFriendRequest} style={{ display: "flex", gap: "10px", alignItems: "stretch", flexWrap: "wrap" }}>
              <input
                type="tel"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                placeholder="Enter parent's phone number (e.g. 1234567890)"
                disabled={!isPremium(currentStudent) || isSearchingFriend}
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "12px 16px",
                  fontSize: "1rem",
                  borderRadius: "12px",
                  border: "3.5px solid #cbd5e1",
                  fontWeight: "600",
                  backgroundColor: isPremium(currentStudent) ? "var(--bg-primary)" : "#f1f5f9",
                  color: "var(--text-primary)"
                }}
              />
              <button
                type="submit"
                disabled={!isPremium(currentStudent) || isSearchingFriend || !friendPhone.trim()}
                className="btn btn-primary"
                style={{
                  padding: "12px 24px",
                  fontSize: "1rem",
                  fontWeight: "800",
                  borderRadius: "12px",
                  boxShadow: "0 4px 0 var(--accent-secondary)",
                  border: "none",
                  cursor: (!isPremium(currentStudent) || isSearchingFriend || !friendPhone.trim()) ? "not-allowed" : "pointer"
                }}
              >
                {isSearchingFriend ? "Searching..." : "Send Request 🚀"}
              </button>
            </form>
            {!isPremium(currentStudent) && (
              <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#ef4444", fontWeight: "700" }}>
                🔒 Upgrading to Premium is required to invite friends by phone number.
              </p>
            )}
          </PlayCard>

          {/* Pending Requests Panel */}
          {(friendRequests.filter(r => r.status === "pending").length > 0) && (
            <PlayCard style={{ padding: "20px", borderRadius: "20px" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "900", color: "var(--text-primary)" }}>
                🔔 Pending Requests
              </h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Received Requests */}
                {friendRequests.filter(r => r.receiverId === currentStudent?.id && r.status === "pending").map(req => (
                  <div
                    key={req.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--bg-primary)",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.5rem" }}>👋</span>
                      <div style={{ textAlign: "left" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{req.senderName}</strong> wants to be friends!
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Phone: {req.senderPhone || "N/A"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleAcceptRequest(req.id, req.senderName)}
                        className="btn btn-success"
                        style={{ padding: "8px 14px", fontSize: "0.85rem", borderRadius: "10px", border: "none", cursor: "pointer", boxShadow: "0 3px 0 #16a34a" }}
                      >
                        Accept ✔
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req.id, req.senderName)}
                        style={{
                          padding: "8px 14px",
                          fontSize: "0.85rem",
                          borderRadius: "10px",
                          border: "2px solid #fca5a5",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          fontWeight: "800",
                          cursor: "pointer",
                          boxShadow: "0 3px 0 #ef4444"
                        }}
                      >
                        Decline ✖
                      </button>
                    </div>
                  </div>
                ))}

                {/* Sent Requests */}
                {friendRequests.filter(r => r.senderId === currentStudent?.id && r.status === "pending").map(req => (
                  <div
                    key={req.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--bg-primary)",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "12px 16px",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.3rem" }}>✉</span>
                      <div style={{ textAlign: "left" }}>
                        Sent request to <strong style={{ fontSize: "0.95rem" }}>{req.receiverName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Phone: {req.receiverPhone || "N/A"}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#b45309", backgroundColor: "#fffbeb", padding: "4px 8px", borderRadius: "8px", fontWeight: "800", marginRight: "8px" }}>
                        Waiting... ⌛
                      </span>
                      <button
                        onClick={() => handleDeclineRequest(req.id, req.receiverName)}
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.8rem",
                          borderRadius: "8px",
                          border: "1.5px solid #cbd5e1",
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </PlayCard>
          )}

          {/* My Own Highscores (For flexing) */}
          {isPremium(currentStudent) && myHighscores.length > 0 && (
            <PlayCard style={{ padding: "20px", borderRadius: "20px" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "900", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🏆 My Highscores (Brag & Flex)</span>
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                {myHighscores.map(hs => (
                  <div
                    key={hs.gameId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--bg-secondary)",
                      border: "2px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "10px 14px"
                    }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{hs.title}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: "900", marginTop: "2px" }}>
                        🎯 Max Score: {hs.maxCorrect} correct
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveFlexGame({ gameId: hs.gameId, title: hs.title, score: hs.maxCorrect });
                        setShowFlexModal(true);
                      }}
                      className="btn btn-success"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 3px 0 #16a34a"
                      }}
                    >
                      💪 Flex
                    </button>
                  </div>
                ))}
              </div>
            </PlayCard>
          )}

          {/* Challenge & Flex Notifications Inbox */}
          {isPremium(currentStudent) && (
            <PlayCard style={{ padding: "20px", borderRadius: "20px" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "900", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>📬 Social Inbox</span>
              </h4>
              
              {(() => {
                const visibleInboxChallenges = challenges.filter(chall => {
                  const isReceived = chall.receiverId === currentStudent?.id;
                  if (chall.type === "flex") {
                    return isReceived;
                  }
                  if (isReceived) {
                    return chall.status === "pending" || chall.status === "completed";
                  } else {
                    return chall.status === "completed";
                  }
                });

                if (visibleInboxChallenges.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-secondary)", fontWeight: "600" }}>
                      <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>🎈</span>
                      No Challenge / Flex from your Buddy
                    </div>
                  );
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {visibleInboxChallenges.map(chall => {
                      const isReceived = chall.receiverId === currentStudent?.id;
                      
                      if (chall.type === "flex") {
                        return (
                          <div
                            key={chall.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              backgroundColor: "#f0fdf4",
                              border: "2.5px solid #86efac",
                              borderRadius: "14px",
                              padding: "12px 16px",
                              flexWrap: "wrap",
                              gap: "10px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "1.5rem" }}>💪</span>
                              <div style={{ textAlign: "left" }}>
                                <strong>{chall.senderName}</strong> flexed a score of <strong>{chall.senderScore}</strong> correct in <strong>{chall.gameTitle}</strong>! Can you beat it? 🏆
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Sent: {new Date(chall.createdAt).toLocaleTimeString()}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDismissChallenge(chall.id)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                borderRadius: "8px",
                                border: "1.5px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                                color: "#475569",
                                fontWeight: "800",
                                cursor: "pointer"
                              }}
                            >
                              Cool! 👍
                            </button>
                          </div>
                        );
                      }

                      // It is a challenge
                      if (isReceived) {
                        if (chall.status === "pending") {
                          return (
                            <div
                              key={chall.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#eff6ff",
                                border: "2.5px solid #bfdbfe",
                                borderRadius: "14px",
                                padding: "12px 16px",
                                flexWrap: "wrap",
                                gap: "10px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "1.5rem" }}>⚔️</span>
                                <div style={{ textAlign: "left" }}>
                                  <strong>{chall.senderName}</strong> challenged you to beat their score of <strong>{chall.senderScore}</strong> correct in <strong>{chall.gameTitle}</strong>!
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Sent: {new Date(chall.createdAt).toLocaleTimeString()}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                  onClick={() => handlePlayChallenge(chall)}
                                  className="btn btn-primary animate-tag-pulse"
                                  style={{ padding: "8px 14px", fontSize: "0.85rem", borderRadius: "10px", border: "none", cursor: "pointer", boxShadow: "0 3px 0 var(--accent-secondary)" }}
                                >
                                  Play & Beat it! 🎮
                                </button>
                                <button
                                  onClick={() => handleDismissChallenge(chall.id)}
                                  style={{
                                    padding: "8px 14px",
                                    fontSize: "0.85rem",
                                    borderRadius: "10px",
                                    border: "1.5px solid #cbd5e1",
                                    backgroundColor: "#ffffff",
                                    color: "#475569",
                                    fontWeight: "800",
                                    cursor: "pointer"
                                  }}
                                >
                                  Ignore
                                </button>
                              </div>
                            </div>
                          );
                        } else {
                          const receiverBeatSender = (chall.receiverScore || 0) >= chall.senderScore;
                          return (
                            <div
                              key={chall.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: receiverBeatSender ? "#ecfdf5" : "#fff5f5",
                                border: receiverBeatSender ? "2.5px solid #a7f3d0" : "2.5px solid #fecaca",
                                borderRadius: "14px",
                                padding: "12px 16px",
                                flexWrap: "wrap",
                                gap: "10px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "1.5rem" }}>{receiverBeatSender ? "🏆" : "🧸"}</span>
                                <div style={{ textAlign: "left" }}>
                                  {receiverBeatSender ? (
                                    <span>You beat <strong>{chall.senderName}</strong>'s challenge! (You scored <strong>{chall.receiverScore}</strong>, beating their score of <strong>{chall.senderScore}</strong> in <strong>{chall.gameTitle}</strong>!) 🎉</span>
                                  ) : (
                                    <span>You played <strong>{chall.senderName}</strong>'s challenge. (You scored <strong>{chall.receiverScore}</strong>. They scored <strong>{chall.senderScore}</strong> in <strong>{chall.gameTitle}</strong>). Keep practicing! 😊</span>
                                  )}
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Completed: {new Date(chall.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDismissChallenge(chall.id)}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.8rem",
                                  borderRadius: "8px",
                                  border: "1.5px solid #cbd5e1",
                                  backgroundColor: "#ffffff",
                                  color: "#475569",
                                  fontWeight: "800",
                                  cursor: "pointer"
                                }}
                              >
                                Dismiss
                              </button>
                            </div>
                          );
                        }
                      } else {
                        // Sent challenges updates
                        const receiverBeatSender = (chall.receiverScore || 0) >= chall.senderScore;
                        return (
                          <div
                            key={chall.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              backgroundColor: "#faf5ff",
                              border: "2.5px solid #e9d5ff",
                              borderRadius: "14px",
                              padding: "12px 16px",
                              flexWrap: "wrap",
                              gap: "10px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "1.5rem" }}>🏁</span>
                              <div style={{ textAlign: "left" }}>
                                <strong>{chall.receiverName}</strong> completed your challenge in <strong>{chall.gameTitle}</strong>!<br />
                                Score details: {chall.receiverName}: <strong>{chall.receiverScore}</strong> vs You: <strong>{chall.senderScore}</strong>.
                                {receiverBeatSender ? " They beat your score! 😮" : " You stayed ahead! 😎"}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDismissChallenge(chall.id)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                borderRadius: "8px",
                                border: "1.5px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                                color: "#475569",
                                fontWeight: "800",
                                cursor: "pointer"
                              }}
                            >
                              Dismiss
                            </button>
                          </div>
                        );
                      }
                    })}
                  </div>
                );
              })()}
            </PlayCard>
          )}

          {/* My Friends List */}
          <PlayCard style={{ padding: "20px", borderRadius: "20px" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "900", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>👥 My Friends ({friendsList.length})</span>
            </h4>
            
            {friendsList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-secondary)", fontWeight: "600" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "8px" }}>🎈</span>
                No friends added yet. Invite your classmates to check out their progress!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {friendsList.map(friend => {
                  const isExpanded = expandedFriendId === friend.id;
                  const logs = friendLogs[friend.id] || [];
                  
                  // Group logs by gameId to calculate high scores
                  const playedGamesMap: Record<string, { title: string; maxCorrect: number; totalAttempts: number }> = {};
                  logs.forEach(log => {
                    if (!playedGamesMap[log.gameId]) {
                      playedGamesMap[log.gameId] = {
                        title: log.gameTitle,
                        maxCorrect: log.correctAnswers,
                        totalAttempts: 1
                      };
                    } else {
                      playedGamesMap[log.gameId].maxCorrect = Math.max(playedGamesMap[log.gameId].maxCorrect, log.correctAnswers);
                      playedGamesMap[log.gameId].totalAttempts += 1;
                    }
                  });
                  const playedGames = Object.values(playedGamesMap);

                  // Find the request ID to allow unfriending
                  const relRequest = friendRequests.find(r => 
                    r.status === "accepted" && 
                    ((r.senderId === currentStudent?.id && r.receiverId === friend.id) || 
                     (r.senderId === friend.id && r.receiverId === currentStudent?.id))
                  );

                  return (
                    <div
                      key={friend.id}
                      style={{
                        border: isExpanded ? "3px solid var(--accent-primary)" : "2px solid #cbd5e1",
                        borderRadius: "18px",
                        overflow: "hidden",
                        backgroundColor: "var(--bg-secondary)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Friend Info Header Row */}
                      <div
                        onClick={() => setExpandedFriendId(isExpanded ? null : friend.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 18px",
                          cursor: "pointer",
                          userSelect: "none",
                          backgroundColor: isExpanded ? "rgba(79, 70, 229, 0.05)" : "transparent"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <AvatarIcon avatarId={friend.avatar} size="sm" />
                          <div style={{ textAlign: "left" }}>
                            <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>{friend.name}</strong>
                            <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                              <span style={{ fontSize: "0.8rem", color: "#b45309", fontWeight: "700" }}>⭐ {friend.stars} Stars</span>
                              <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: "700" }}>🔥 {friend.streak} Streak</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {isPremium(currentStudent) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveChallengeFriend(friend);
                                setShowChallengeModal(true);
                              }}
                              className="btn btn-primary"
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.8rem",
                                fontWeight: "800",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                                boxShadow: "0 3px 0 var(--accent-secondary)",
                                marginRight: "4px"
                              }}
                            >
                              ⚔️ Challenge
                            </button>
                          )}
                          <span style={{ fontSize: "1.2rem" }}>
                            {isExpanded ? "🔼" : "🔽"}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Section (High Scores) */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: "16px 18px",
                            backgroundColor: "var(--bg-primary)",
                            borderTop: "2px dashed #cbd5e1"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-secondary)" }}>
                              🎮 Games & Highscores
                            </span>
                            
                            {/* Unfriend Button */}
                            {relRequest && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to remove ${friend.name} from friends?`)) {
                                    handleDeclineRequest(relRequest.id, friend.name, true);
                                  }
                                }}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "0.75rem",
                                  backgroundColor: "transparent",
                                  border: "1.5px solid #fca5a5",
                                  color: "#b91c1c",
                                  borderRadius: "8px",
                                  fontWeight: "800",
                                  cursor: "pointer"
                                }}
                              >
                                Unfriend ✖
                              </button>
                            )}
                          </div>

                          {!isPremium(currentStudent) ? (
                            /* Premium Locked Highscores for Free Users */
                            <div
                              style={{
                                textAlign: "center",
                                padding: "20px 10px",
                                backgroundColor: "rgba(239, 68, 68, 0.05)",
                                border: "2px dashed #fca5a5",
                                borderRadius: "14px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px"
                              }}
                            >
                              <span style={{ fontSize: "2rem" }}>🔒</span>
                              <strong style={{ fontSize: "0.9rem", color: "#b91c1c" }}>High Scores Locked</strong>
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600", lineHeight: "1.4" }}>
                                Viewing friend high scores is a premium feature.<br />
                                Upgrade your account to unlock this feature!
                              </p>
                              <button
                                onClick={handleUpgradeToPremium}
                                className="btn btn-success"
                                style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px", marginTop: "4px" }}
                              >
                                💎 Upgrade Now
                              </button>
                            </div>
                          ) : (
                            /* Scores List for Premium Users */
                            <div>
                              {playedGames.length === 0 ? (
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                                  This friend hasn't played any games yet. 🎮
                                </div>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                                  {playedGames.map(game => (
                                    <div
                                      key={game.title}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        backgroundColor: "var(--bg-secondary)",
                                        padding: "10px 14px",
                                        borderRadius: "10px",
                                        border: "1.5px solid #e2e8f0"
                                      }}
                                    >
                                      <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--text-primary)" }}>
                                        {game.title}
                                      </span>
                                      <div style={{ display: "flex", gap: "10px" }}>
                                        <span style={{ fontSize: "0.85rem", color: "var(--accent-primary)", fontWeight: "900", backgroundColor: "rgba(79, 70, 229, 0.08)", padding: "3px 8px", borderRadius: "6px" }}>
                                          🎯 Max Score: {game.maxCorrect} correct
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </PlayCard>
        </div>
      )}

      {/* Exit Dashboard using kids-friendly exit door */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "28px", marginBottom: "10px" }}>
        <button
          onClick={() => setShowExitConfirm(true)}
          style={{
            width: "55px",
            height: "55px",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            border: "4px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.7rem",
            cursor: "pointer",
            boxShadow: "0 6px 0 #ef4444",
            outline: "none"
          }}
          title="Exit Account"
        >
          🚪
        </button>
      </div>

      {/* Accidental Log-out protection modal */}
      {showExitConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "350px",
              width: "100%",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)"
            }}
          >
            <div style={{ fontSize: "3.5rem", animation: "bounce 2s infinite" }}>🚪</div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: "900", color: "var(--text-primary)", margin: 0 }}>
              Are you leaving?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
              Do you really want to close your dashboard and exit?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-success"
                style={{ width: "100%", padding: "14px", fontSize: "1.1rem", fontWeight: "800", boxShadow: "0 4px 0 #16a34a" }}
              >
                🎮 Keep Playing!
              </button>
              <button
                onClick={handleStudentLogOut}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "0.85rem",
                  backgroundColor: "#fee2e2",
                  border: "2px solid #fca5a5",
                  color: "#b91c1c",
                  borderRadius: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  marginTop: "8px"
                }}
              >
                🚪 Yes, Exit
              </button>
            </div>
          </PlayCard>
        </div>
      )}

      {/* 1. Request Game Idea Modal */}
      {showRequestModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "420px",
              width: "100%",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)",
              borderRadius: "24px",
              boxShadow: "0 12px 24px rgba(0,0,0,0.15)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px dashed #cbd5e1", paddingBottom: "12px" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <span>💡 Shared Idea Studio</span>
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.8rem",
                  cursor: "pointer",
                  fontWeight: "900",
                  color: "var(--text-secondary)"
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitIdea} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.4" }}>
                What kind of game do you want to play? Write or describe your game idea below:
              </p>

              <textarea
                value={requestIdeaText}
                onChange={(e) => setRequestIdeaText(e.target.value)}
                placeholder="E.g., 'I want a balloon counting game with cute dinosaurs!' or 'A puzzle game where I match shapes!'"
                rows={4}
                required
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "2px solid #cbd5e1",
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  resize: "none",
                  boxSizing: "border-box",
                  backgroundColor: "var(--bg-primary)"
                }}
              />

              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn btn-gray"
                  style={{ flex: 1, padding: "12px", fontSize: "0.95rem", fontWeight: "800" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIdea}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 0 var(--accent-secondary)"
                  }}
                >
                  <Send size={16} fill="white" />
                  <span>{isSubmittingIdea ? "Sending..." : "Send Idea! 🚀"}</span>
                </button>
              </div>
            </form>
          </PlayCard>
        </div>
      )}

      {/* 2. Idea Success Confetti Popup */}
      {showIdeaSuccess && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid #10b981",
              borderRadius: "24px"
            }}
          >
            <div style={{ fontSize: "3.5rem", animation: "kids-bounce 2s infinite ease-in-out" }}>🎉</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#065f46", margin: 0 }}>
              Idea Sent! Yay!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
              Your game suggestion was sent straight to your teacher! Keep checking your dashboard for new games!
            </p>
            <button
              onClick={() => setShowIdeaSuccess(false)}
              className="btn btn-success"
              style={{ width: "100%", padding: "14px", fontSize: "1.05rem", fontWeight: "800", boxShadow: "0 4px 0 #16a34a" }}
            >
              Okay! 🎈
            </button>
          </PlayCard>
        </div>
      )}

      {/* 3. Premium Locked Game Dialog */}
      {showLockModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "360px",
              width: "100%",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid #ef4444",
              borderRadius: "24px"
            }}
          >
            <div style={{ fontSize: "3.5rem", animation: "kids-wiggle 2s infinite ease-in-out" }}>
              {lockedReason === "stars" ? "⭐" : "🔒"}
            </div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: "900", color: lockedReason === "stars" ? "#b45309" : "#b91c1c", margin: 0 }}>
              {lockedReason === "stars" ? "Stars Required!" : "Premium Game!"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
              {lockedReason === "stars" ? (
                <span>
                  You need <strong>{lockedStarsRequired.toLocaleString()}</strong> Stars to unlock "{lockedGameTitle}".<br />
                  You currently have <strong>{currentStudent?.stars || 0}</strong> stars. Keep playing to collect more! 🎈
                </span>
              ) : (
                <span>
                  "{lockedGameTitle}" is a premium quest. Please ask your parent or teacher to unlock it for you!
                </span>
              )}
            </p>
            <button
              onClick={() => setShowLockModal(false)}
              className="btn btn-danger"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1.05rem",
                fontWeight: "800",
                backgroundColor: lockedReason === "stars" ? "#d97706" : "#ef4444",
                borderColor: lockedReason === "stars" ? "#b45309" : "#dc2626",
                color: "#ffffff",
                boxShadow: `0 4px 0 ${lockedReason === "stars" ? "#b45309" : "#dc2626"}`
              }}
            >
              {lockedReason === "stars" ? "Okay! 🎮" : "Go Back"}
            </button>
          </PlayCard>
        </div>
      )}

      {/* 4. Flex selector Modal */}
      {showFlexModal && activeFlexGame && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "360px",
              width: "100%",
              padding: "24px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)",
              borderRadius: "24px",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem", fontWeight: "900" }}>
              💪 Flex Your Score!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", margin: "0 0 20px 0" }}>
              Flex your score of <strong>{activeFlexGame.score}</strong> in <strong>{activeFlexGame.title}</strong> on a friend:
            </p>

            {friendsList.length === 0 ? (
              <p style={{ fontStyle: "italic", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Add some friends first to flex your scores!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", marginBottom: "20px" }}>
                {friendsList.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => handleFlexScore(friend.id, friend.name)}
                    className="btn btn-gray"
                    style={{
                      padding: "10px",
                      fontSize: "0.95rem",
                      fontWeight: "800",
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <AvatarIcon avatarId={friend.avatar} size="sm" />
                    <span>Flex with {friend.name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowFlexModal(false)}
              className="btn btn-gray"
              style={{ width: "100%", padding: "12px", fontWeight: "800" }}
            >
              Close
            </button>
          </PlayCard>
        </div>
      )}

      {/* 5. Challenge Game selector Modal */}
      {showChallengeModal && activeChallengeFriend && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "360px",
              width: "100%",
              padding: "24px",
              backgroundColor: "var(--bg-secondary)",
              border: "4px solid var(--accent-primary)",
              borderRadius: "24px",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem", fontWeight: "900" }}>
              ⚔️ Challenge {activeChallengeFriend.name}!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", margin: "0 0 20px 0" }}>
              Select a game to challenge them:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto", marginBottom: "20px" }}>
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleSendChallenge(game.id, game.title)}
                  className="btn btn-gray"
                  style={{
                    padding: "10px",
                    fontSize: "0.95rem",
                    fontWeight: "800",
                    width: "100%",
                    textAlign: "left"
                  }}
                >
                  {game.title}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowChallengeModal(false)}
              className="btn btn-gray"
              style={{ width: "100%", padding: "12px", fontWeight: "800" }}
            >
              Cancel
            </button>
          </PlayCard>
        </div>
      )}

      {/* 6. Frog Uncle Premium Upgrade Modal */}
      {showFrogModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10005,
            padding: "20px",
            backdropFilter: "blur(5px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "380px",
              width: "100%",
              padding: "28px 24px",
              backgroundColor: "#f0fdf4",
              border: "4px solid #22c55e",
              borderRadius: "24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 12px 24px rgba(34, 197, 94, 0.15)"
            }}
          >
            <div style={{ fontSize: "4.5rem", animation: "kids-wiggle 2s infinite ease-in-out" }}>🐸</div>
            
            <h3 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "900", color: "#166534" }}>
              Frog Uncle's Magic! ✨
            </h3>
            
            <p style={{ color: "#1b6535", fontSize: "1.05rem", fontWeight: "700", margin: 0, lineHeight: "1.5" }}>
              Want to unlock Premium and play games with your friends? <br />
              Ask your parent to call <strong>Frog Uncle</strong>! 📞
            </p>

            <a
              href="tel:+919871229599"
              className="btn btn-success"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1.1rem",
                fontWeight: "900",
                backgroundColor: "#22c55e",
                borderColor: "#16a34a",
                color: "#ffffff",
                borderRadius: "16px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 0 #16a34a",
                textDecoration: "none",
                cursor: "pointer"
              }}
            >
              <span>📞 Call Frog Uncle</span>
            </a>

            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "8px" }}>
              <button
                onClick={() => setShowFrogModal(false)}
                className="btn btn-gray"
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "0.95rem",
                  fontWeight: "800"
                }}
              >
                Not Now
              </button>
            </div>
          </PlayCard>
        </div>
      )}

      {/* 7. Try Premium for 7 days Trial Popup */}
      {showTrialPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10010,
            padding: "20px",
            backdropFilter: "blur(6px)"
          }}
        >
          <PlayCard
            style={{
              maxWidth: "380px",
              width: "100%",
              padding: "32px 24px",
              backgroundColor: "#eff6ff",
              border: "4px solid #3b82f6",
              borderRadius: "24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              boxShadow: "0 12px 24px rgba(59, 130, 246, 0.2)"
            }}
          >
            <div style={{ fontSize: "4.5rem", animation: "bounce 2s infinite" }}>🎁</div>
            
            <h3 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "900", color: "#1e3a8a" }}>
              Try Premium Free! 🌟
            </h3>
            
            <p style={{ color: "#1e40af", fontSize: "1.05rem", fontWeight: "700", margin: 0, lineHeight: "1.5" }}>
              Hey {currentStudent?.name || "there"}! <br />
              Activate your <strong>7-Day Free Trial</strong> to play custom games, challenge friends, and see high scores!
            </p>

            <button
              onClick={handleActivateTrial}
              className="btn btn-success animate-tag-pulse"
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "1.15rem",
                fontWeight: "900",
                backgroundColor: "#22c55e",
                borderColor: "#16a34a",
                color: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 4px 0 #16a34a",
                cursor: "pointer",
                border: "none"
              }}
            >
              🚀 Start My 7-Day Trial!
            </button>

            <button
              onClick={() => setShowTrialPopup(false)}
              className="btn btn-gray"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "0.9rem",
                fontWeight: "800"
              }}
            >
              Maybe Later
            </button>
          </PlayCard>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
