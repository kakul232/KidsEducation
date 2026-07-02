import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, FriendRequest, Student, Challenge } from "../../services/db";
import { Send } from "lucide-react";
import { AvatarIcon } from "../../components/AvatarIcon";
import { PlayCard } from "../../components/PlayCard";
import { KidsModal } from "../../components/KidsModal";
import KidsLoader from "../../components/KidsLoader";
import { StudentHeader } from "../../components/student/StudentHeader";
import { PWABanners } from "../../components/student/PWABanners";
import { SubjectSelector } from "../../components/student/SubjectSelector";
import { GameList } from "../../components/student/GameList";
import { FriendsHub } from "../../components/student/FriendsHub";

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
      {/* Student Profile Header */}
      <StudentHeader currentStudent={currentStudent} isPremium={isPremium} />

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
          <PWABanners
            installPrompt={installPrompt}
            triggerInstall={triggerInstall}
            notiPermission={notiPermission}
            requestNotiPermission={requestNotiPermission}
          />

          <SubjectSelector
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />

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

          <GameList
            games={games}
            viewMode={viewMode}
            completedGames={completedGames}
            currentStudent={currentStudent}
            isPremium={isPremium}
            isNew={isNew}
            parseGameTitle={parseGameTitle}
            DIFFICULTY_SYMBOLS={DIFFICULTY_SYMBOLS}
            onPlayGame={setPlayingGame}
            onShowLockModal={(title, reason, starsReq) => {
              setLockedGameTitle(title);
              setLockedReason(reason);
              setLockedStarsRequired(starsReq);
              setShowLockModal(true);
            }}
            speakText={speakText}
            visibleGameCount={visibleGameCount}
            showRequestModalToggle={() => setShowRequestModal(true)}
          />
        </>
      )}

      {/* Friends Hub Panel */}
      {activeTab === "friends" && (
        <FriendsHub
          currentStudent={currentStudent}
          isPremium={isPremium}
          socialError={socialError}
          socialSuccess={socialSuccess}
          handleUpgradeToPremium={handleUpgradeToPremium}
          friendPhone={friendPhone}
          setFriendPhone={setFriendPhone}
          isSearchingFriend={isSearchingFriend}
          handleSendFriendRequest={handleSendFriendRequest}
          friendRequests={friendRequests}
          handleAcceptRequest={handleAcceptRequest}
          handleDeclineRequest={handleDeclineRequest}
          myHighscores={myHighscores}
          setActiveFlexGame={setActiveFlexGame}
          setShowFlexModal={setShowFlexModal}
          challenges={challenges}
          handleDismissChallenge={handleDismissChallenge}
          handlePlayChallenge={handlePlayChallenge}
          friendsList={friendsList}
          expandedFriendId={expandedFriendId}
          setExpandedFriendId={setExpandedFriendId}
          friendLogs={friendLogs}
          setActiveChallengeFriend={setActiveChallengeFriend}
          setShowChallengeModal={setShowChallengeModal}
        />
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
      <KidsModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        zIndex={1000}
        maxWidth="350px"
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
            autoFocus
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
      </KidsModal>

      {/* 1. Request Game Idea Modal */}
      <KidsModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        maxWidth="420px"
        padding="24px"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2.5px dashed #cbd5e1", paddingBottom: "12px", width: "100%" }}>
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

        <form onSubmit={handleSubmitIdea} style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.4", textAlign: "left" }}>
            What kind of game do you want to play? Write or describe your game idea below:
          </p>

          <textarea
            autoFocus
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
      </KidsModal>

      {/* 2. Idea Success Confetti Popup */}
      <KidsModal
        isOpen={showIdeaSuccess}
        onClose={() => setShowIdeaSuccess(false)}
        borderColor="#10b981"
        maxWidth="360px"
      >
        <div style={{ fontSize: "3.5rem", animation: "kids-bounce 2s infinite ease-in-out" }}>🎉</div>
        <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#065f46", margin: 0 }}>
          Idea Sent! Yay!
        </h3>
        <p style={{ color: "var(--text-secondary)", fontWeight: "700", fontSize: "0.95rem", margin: 0, lineHeight: "1.4" }}>
          Your game suggestion was sent straight to your teacher! Keep checking your dashboard for new games!
        </p>
        <button
          autoFocus
          onClick={() => setShowIdeaSuccess(false)}
          className="btn btn-success"
          style={{ width: "100%", padding: "14px", fontSize: "1.05rem", fontWeight: "800", boxShadow: "0 4px 0 #16a34a" }}
        >
          Okay! 🎈
        </button>
      </KidsModal>

      {/* 3. Premium Locked Game Dialog */}
      <KidsModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        borderColor="#ef4444"
        maxWidth="360px"
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
          autoFocus
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
      </KidsModal>

      {/* 4. Flex selector Modal */}
      <KidsModal
        isOpen={showFlexModal && !!activeFlexGame}
        onClose={() => setShowFlexModal(false)}
        maxWidth="360px"
        padding="24px"
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem", fontWeight: "900" }}>
          💪 Flex Your Score!
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", margin: "0 0 20px 0" }}>
          Flex your score of <strong>{activeFlexGame?.score}</strong> in <strong>{activeFlexGame?.title}</strong> on a friend:
        </p>

        {friendsList.length === 0 ? (
          <p style={{ fontStyle: "italic", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Add some friends first to flex your scores!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", WebkitOverflowScrolling: "touch", marginBottom: "20px", width: "100%" }}>
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
          autoFocus
          onClick={() => setShowFlexModal(false)}
          className="btn btn-gray"
          style={{ width: "100%", padding: "12px", fontWeight: "800" }}
        >
          Close
        </button>
      </KidsModal>

      {/* 5. Challenge Game selector Modal */}
      <KidsModal
        isOpen={showChallengeModal && !!activeChallengeFriend}
        onClose={() => setShowChallengeModal(false)}
        maxWidth="360px"
        padding="24px"
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.3rem", fontWeight: "900" }}>
          ⚔️ Challenge {activeChallengeFriend?.name}!
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", fontWeight: "600", margin: "0 0 20px 0" }}>
          Select a game to challenge them:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto", WebkitOverflowScrolling: "touch", marginBottom: "20px", width: "100%" }}>
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
          autoFocus
          onClick={() => setShowChallengeModal(false)}
          className="btn btn-gray"
          style={{ width: "100%", padding: "12px", fontWeight: "800" }}
        >
          Cancel
        </button>
      </KidsModal>

      {/* 6. Frog Uncle Premium Upgrade Modal */}
      <KidsModal
        isOpen={showFrogModal}
        onClose={() => setShowFrogModal(false)}
        backgroundColor="#f0fdf4"
        borderColor="#22c55e"
        maxWidth="380px"
        padding="28px 24px"
        gap="16px"
        style={{ boxShadow: "0 12px 24px rgba(34, 197, 94, 0.15)" }}
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
          autoFocus
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

        <button
          onClick={async () => {
            const studentName = currentStudent?.name || "Student";
            const studentId = currentStudent?.id || "";
            const parentPhone = currentStudent?.phone || "0000000000";
            const firstFour = studentName.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase() || "STUD";
            const lastFourPhone = parentPhone.slice(-4);
            const uniqueHex = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0").toUpperCase();
            const txnId = `TN-${firstFour}-${lastFourPhone}-${uniqueHex}`;

            try {
              await LocalDB.createPaymentRecord({
                txnId,
                studentId,
                studentName,
                parentPhone,
                amount: 49,
                status: "pending",
                createdAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Failed to create payment record:", err);
            }

            const payUrl = `upi://pay?pa=Q668504716@ybl&am=49&cu=INR&tn=${encodeURIComponent(studentName + " tution Fee")}&tr=${txnId}`;
            window.location.href = payUrl;
          }}
          className="btn"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "1.1rem",
            fontWeight: "900",
            backgroundColor: "#4f46e5",
            borderColor: "#4338ca",
            color: "#ffffff",
            borderRadius: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 0 #4338ca",
            border: "none",
            cursor: "pointer",
            marginTop: "4px"
          }}
        >
          <span>💳 Pay ₹49/month (Launch Offer)</span>
        </button>

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
      </KidsModal>

      {/* 7. Try Premium for 7 days Trial Popup */}
      <KidsModal
        isOpen={showTrialPopup}
        onClose={() => setShowTrialPopup(false)}
        backgroundColor="#eff6ff"
        borderColor="#3b82f6"
        maxWidth="380px"
        padding="32px 24px"
        zIndex={10010}
        style={{ boxShadow: "0 12px 24px rgba(59, 130, 246, 0.2)" }}
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
          autoFocus
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
      </KidsModal>
    </div>
  );
};
export default Dashboard;
