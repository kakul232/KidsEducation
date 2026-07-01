import React from "react";

interface AdminHeaderProps {
  setView: (view: any) => void;
  logOutAdmin: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ setView, logOutAdmin }) => {
  return (
    <div className="admin-header">
      <div>
        <h1 style={{ fontSize: "1.4rem", color: "var(--text-primary)" }}>🏫 Educator Dashboard</h1>
        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>School Management & AI Studio</span>
      </div>
      <div className="admin-header-actions">
        <button
          onClick={() => setView("onboarding")}
          className="btn btn-gray"
          style={{ padding: "10px 16px", fontSize: "0.85rem", boxShadow: "none" }}
        >
          Play Mode
        </button>
        <button
          onClick={logOutAdmin}
          className="btn btn-primary"
          style={{ padding: "10px 16px", fontSize: "0.85rem", boxShadow: "none" }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default AdminHeader;
