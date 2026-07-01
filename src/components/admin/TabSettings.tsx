import React from "react";

interface TabSettingsProps {
  apiKeyInput: string;
  setApiKeyInput: (val: string) => void;
  handleSaveSettings: (e: React.FormEvent) => void;
  manualNotiTitle: string;
  setManualNotiTitle: (val: string) => void;
  manualNotiMessage: string;
  setManualNotiMessage: (val: string) => void;
  handleSendManualNotification: () => void;
}

export const TabSettings: React.FC<TabSettingsProps> = ({
  apiKeyInput,
  setApiKeyInput,
  handleSaveSettings,
  manualNotiTitle,
  setManualNotiTitle,
  manualNotiMessage,
  setManualNotiMessage,
  handleSendManualNotification
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <form onSubmit={handleSaveSettings} className="play-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem" }}>Settings Configuration</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Configures AI generation keys and student difficulty parameters.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="gemini-api-key-input" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Google Gemini API Key</label>
          <input
            id="gemini-api-key-input"
            type="password"
            placeholder="Enter Gemini API key (e.g. AIzaSy...)"
            value={apiKeyInput || ""}
            onChange={e => setApiKeyInput(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "2px solid #cbd5e1"
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Leaves empty to run with sandbox templates fallback.
          </span>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "12px 24px" }}>
          Save Configuration
        </button>
      </form>

      {/* Manual Alert Broadcast Panel */}
      <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <h3 style={{ fontSize: "1.1rem" }}>📢 Push Notifications Broadcast</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Trigger manual alerts and broadcasts immediately to all active students.
          </p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="noti-title-input" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Alert Title</label>
            <input
              id="noti-title-input"
              type="text"
              placeholder="e.g. New Challenge! 🏆"
              value={manualNotiTitle}
              onChange={e => setManualNotiTitle(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1"
              }}
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="noti-message-input" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Alert Message</label>
            <textarea
              id="noti-message-input"
              placeholder="e.g. Try our new Addition Quest and score stars!"
              value={manualNotiMessage}
              onChange={e => setManualNotiMessage(e.target.value)}
              rows={3}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1",
                resize: "none"
              }}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleSendManualNotification}
          className="btn btn-primary"
          style={{ alignSelf: "flex-start", padding: "12px 24px" }}
        >
          Send Alert Broadcast 🚀
        </button>
      </div>
    </div>
  );
};

export default TabSettings;
