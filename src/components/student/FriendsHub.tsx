import React from "react";
import type { Student, FriendRequest } from "../../services/db";
import { PlayCard } from "../PlayCard";
import { AvatarIcon } from "../AvatarIcon";

interface FriendsHubProps {
  currentStudent: Student | null;
  isPremium: (student: Student | null) => boolean;
  socialError: string | null;
  socialSuccess: string | null;
  handleUpgradeToPremium: () => void;
  friendPhone: string;
  setFriendPhone: (phone: string) => void;
  isSearchingFriend: boolean;
  handleSendFriendRequest: (e: React.FormEvent) => void;
  friendRequests: FriendRequest[];
  handleAcceptRequest: (reqId: string, senderName: string) => void;
  handleDeclineRequest: (reqId: string, name: string, unfriend?: boolean) => void;
  myHighscores: Array<{ gameId: string; title: string; maxCorrect: number }>;
  setActiveFlexGame: (game: { gameId: string; title: string; score: number } | null) => void;
  setShowFlexModal: (show: boolean) => void;
  challenges: any[];
  handleDismissChallenge: (challId: string) => void;
  handlePlayChallenge: (chall: any) => void;
  friendsList: Student[];
  expandedFriendId: string | null;
  setExpandedFriendId: (id: string | null) => void;
  friendLogs: Record<string, any[]>;
  setActiveChallengeFriend: (friend: Student | null) => void;
  setShowChallengeModal: (show: boolean) => void;
}

export const FriendsHub: React.FC<FriendsHubProps> = ({
  currentStudent,
  isPremium,
  socialError,
  socialSuccess,
  handleUpgradeToPremium,
  friendPhone,
  setFriendPhone,
  isSearchingFriend,
  handleSendFriendRequest,
  friendRequests,
  handleAcceptRequest,
  handleDeclineRequest,
  myHighscores,
  setActiveFlexGame,
  setShowFlexModal,
  challenges,
  handleDismissChallenge,
  handlePlayChallenge,
  friendsList,
  expandedFriendId,
  setExpandedFriendId,
  friendLogs,
  setActiveChallengeFriend,
  setShowChallengeModal
}) => {
  return (
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
  );
};

export default FriendsHub;
