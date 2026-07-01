import React from "react";
import { Lock } from "lucide-react";
import KidsLoader from "../KidsLoader";

interface AdminLoginProps {
  isAuthLoading: boolean;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  authError: string;
  handleLogin: (e: React.FormEvent) => void;
  setView: (view: any) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  isAuthLoading,
  email,
  setEmail,
  password,
  setPassword,
  authError,
  handleLogin,
  setView
}) => {
  return (
    <div className="container animate-slide-up" style={{ justifyContent: "center" }}>
      {isAuthLoading && <KidsLoader />}
      <div className="play-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "var(--accent-primary)",
              color: "#fff",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px"
            }}
          >
            <Lock size={30} />
          </div>
          <h2 style={{ fontSize: "1.5rem" }}>Admin Portal Login</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Secure authentication for educators & administrators
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="admin-email-field" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Email Address</label>
            <input
              id="admin-email-field"
              type="email"
              placeholder="teacher@school.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: "14px",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "2px solid #cbd5e1"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="admin-pass-field" style={{ fontWeight: "700", fontSize: "0.9rem" }}>Password</label>
            <input
              id="admin-pass-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                padding: "14px",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "2px solid #cbd5e1"
              }}
            />
          </div>

          {authError && (
            <span style={{ color: "var(--accent-primary)", fontWeight: "600", fontSize: "0.95rem" }}>
              {authError}
            </span>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: "16px" }}>
            Log In to Portal
          </button>
        </form>

        <button
          onClick={() => setView("onboarding")}
          className="btn btn-gray"
          style={{ padding: "10px", fontSize: "0.9rem", boxShadow: "none" }}
        >
          Back to Student Screen
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
