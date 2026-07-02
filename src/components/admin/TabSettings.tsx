import React, { useState } from "react";
import { useApp } from "../../context/AppContext";

export const TabSettings: React.FC = () => {
  const { geminiApiKey, saveApiKey, sendPushNotification } = useApp();

  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [manualNotiTitle, setManualNotiTitle] = useState("");
  const [manualNotiMessage, setManualNotiMessage] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey(apiKeyInput);
    alert("Settings saved successfully!");
  };

  const handleSendManualNotification = async () => {
    if (!manualNotiTitle.trim() || !manualNotiMessage.trim()) {
      alert("Please fill in both the Alert Title and Alert Message!");
      return;
    }
    try {
      await sendPushNotification(manualNotiTitle.trim(), manualNotiMessage.trim());
      alert("Push notification broadcasted successfully! 🚀");
      setManualNotiTitle("");
      setManualNotiMessage("");
    } catch (err) {
      console.error("Failed to send manual notification broadcast:", err);
      alert("Failed to send manual notification broadcast.");
    }
  };

  return (
    <div className="admin-content-container">
      <form onSubmit={handleSaveSettings} className="play-card admin-card-flex">
        <div>
          <h3>Settings Configuration</h3>
          <p className="admin-text-desc">
            Configures AI generation keys and student difficulty parameters.
          </p>
        </div>

        <div className="admin-form-group">
          <label htmlFor="gemini-api-key-input" className="admin-login-label">Google Gemini API Key</label>
          <input
            id="gemini-api-key-input;;"
            type="password"
            placeholder="Enter Gemini API key (e.g. AIzaSy...)"
            value={apiKeyInput || ""}
            onChange={e => setApiKeyInput(e.target.value)}
            className="admin-settings-input"
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Leaves empty to run with sandbox templates fallback.
          </span>
        </div>

        <button type="submit" className="btn btn-primary admin-btn-self-start">
          Save Configuration
        </button>
      </form>

      {/* Manual Alert Broadcast Panel */}
      <div className="play-card admin-card-flex-small">
        <div>
          <h3>📢 Push Notifications Broadcast</h3>
          <p className="admin-text-desc">
            Trigger manual alerts and broadcasts immediately to all active students.
          </p>
        </div>
        
        <div className="admin-form-group-large">
          <div className="admin-form-group">
            <label htmlFor="noti-title-input" className="admin-login-label">Alert Title</label>
            <input
              id="noti-title-input"
              type="text"
              placeholder="e.g. New Challenge! 🏆"
              value={manualNotiTitle}
              onChange={e => setManualNotiTitle(e.target.value)}
              className="admin-settings-input"
            />
          </div>
          
          <div className="admin-form-group">
            <label htmlFor="noti-message-input" className="admin-login-label">Alert Message</label>
            <textarea
              id="noti-message-input"
              placeholder="e.g. Try our new Addition Quest and score stars!"
              value={manualNotiMessage}
              onChange={e => setManualNotiMessage(e.target.value)}
              rows={3}
              className="admin-settings-input"
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleSendManualNotification}
          className="btn btn-primary admin-btn-self-start"
        >
          Send Alert Broadcast 🚀
        </button>
      </div>
    </div>
  );
};

export default TabSettings;
