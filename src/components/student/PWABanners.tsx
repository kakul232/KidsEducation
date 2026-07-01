import React from "react";
import { PlayCard } from "../PlayCard";

interface PWABannersProps {
  installPrompt: any;
  triggerInstall: () => void;
  notiPermission: NotificationPermission | "default" | "";
  requestNotiPermission: () => void;
}

export const PWABanners: React.FC<PWABannersProps> = ({
  installPrompt,
  triggerInstall,
  notiPermission,
  requestNotiPermission
}) => {
  return (
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
    </>
  );
};

export default PWABanners;
