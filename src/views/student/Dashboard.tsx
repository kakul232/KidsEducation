import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, FriendRequest, Student, Challenge } from "../../services/db";
import KidsLoader from "../../components/KidsLoader";
import { StudentHeader } from "../../components/student/StudentHeader";
import { PWABanners } from "../../components/student/PWABanners";
import { SubjectSelector } from "../../components/student/SubjectSelector";
import { GameList } from "../../components/student/GameList";
import { FriendsHub } from "../../components/student/FriendsHub";

// Import extracted subcomponents
import { ValidityExpiredView } from "./dashboard/ValidityExpiredView";
import { ExitConfirmModal } from "./dashboard/ExitConfirmModal";
import { RequestIdeaModal } from "./dashboard/RequestIdeaModal";
import { IdeaSuccessModal } from "./dashboard/IdeaSuccessModal";
import { LockModal } from "./dashboard/LockModal";
import { FlexModal } from "./dashboard/FlexModal";
import { ChallengeModal } from "./dashboard/ChallengeModal";
import { FrogModal } from "./dashboard/FrogModal";
import { TrialPopupModal } from "./dashboard/TrialPopupModal";

import "./Dashboard.css";

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
  const { currentStudent, setPlayingGame, installPrompt, triggerInstall, notiPermission, requestNotiPermission, speakText } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [completedGames, setCompletedGames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(LocalDB.getCachedGames().length === 0);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [visibleGameCount, setVisibleGameCount] = useState(10);

  // Modals & game requests states
  const [showRequestModal, setShowRequestModal] = useState(false);
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
      <ValidityExpiredView
        currentStudent={currentStudent}
      />
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
      <div className="tab-controller-container">
        <button
          onClick={() => setActiveTab("games")}
          className={`tab-controller-btn ${activeTab === "games" ? "active" : ""}`}
        >
          🎮 Play Games
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={`tab-controller-btn ${activeTab === "friends" ? "active" : ""}`}
        >
          <span>🤝 Friends Hub</span>
          {friendRequests.filter(r => r.receiverId === currentStudent?.id && r.status === "pending").length > 0 && (
            <span className="tab-controller-badge">
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

          <div className="games-header">
            <h3>Choose a Game:</h3>
            <div className="view-mode-btn-group">
              <button
                onClick={() => setViewMode("list")}
                className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
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
      <div className="exit-door-container">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="exit-door-btn"
          title="Exit Account"
        >
          🚪
        </button>
      </div>

      {/* Accidental Log-out protection modal */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
      />

      {/* 1. Request Game Idea Modal */}
      <RequestIdeaModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => setShowIdeaSuccess(true)}
      />

      {/* 2. Idea Success Confetti Popup */}
      <IdeaSuccessModal
        isOpen={showIdeaSuccess}
        onClose={() => setShowIdeaSuccess(false)}
      />

      {/* 3. Premium Locked Game Dialog */}
      <LockModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        gameTitle={lockedGameTitle}
        reason={lockedReason}
        starsRequired={lockedStarsRequired}
      />

      {/* 4. Flex selector Modal */}
      <FlexModal
        isOpen={showFlexModal}
        onClose={() => setShowFlexModal(false)}
        activeFlexGame={activeFlexGame}
        friendsList={friendsList}
        onSuccess={(msg) => {
          setSocialSuccess(msg);
          setTimeout(() => setSocialSuccess(""), 4000);
          fetchSocialData();
        }}
        onError={(msg) => {
          setSocialError(msg);
          setTimeout(() => setSocialError(""), 4000);
        }}
      />

      {/* 5. Challenge Game selector Modal */}
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        activeChallengeFriend={activeChallengeFriend}
        games={games}
        myHighscores={myHighscores}
        onSuccess={(msg) => {
          setSocialSuccess(msg);
          setTimeout(() => setSocialSuccess(""), 4000);
          fetchSocialData();
        }}
        onError={(msg) => {
          setSocialError(msg);
          setTimeout(() => setSocialError(""), 4000);
        }}
      />

      {/* 6. Frog Uncle Premium Upgrade Modal */}
      <FrogModal
        isOpen={showFrogModal}
        onClose={() => setShowFrogModal(false)}
      />

      {/* 7. Try Premium for 7 days Trial Popup */}
      <TrialPopupModal
        isOpen={showTrialPopup}
        onClose={() => setShowTrialPopup(false)}
        onTrialActivated={fetchSocialData}
        onShowSuccess={(msg) => {
          setSocialSuccess(msg);
          setTimeout(() => setSocialSuccess(""), 4000);
        }}
        onShowError={(msg) => {
          setSocialError(msg);
          setTimeout(() => setSocialError(""), 4000);
        }}
      />
    </div>
  );
};

export default Dashboard;
