import React, { useState } from "react";
import { Lock } from "lucide-react";
import KidsLoader from "../KidsLoader";
import { useApp } from "../../context/AppContext";

export const AdminLogin: React.FC = () => {
  const { logInAdmin, setView } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    setAuthError("");
    setIsAuthLoading(true);
    try {
      await logInAdmin(email, password);
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setAuthError("Invalid credentials. Please verify your email and password.");
      } else {
        setAuthError(err.message || "Authentication failed. Try again.");
      }
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="container admin-login-container animate-slide-up">
      {isAuthLoading && <KidsLoader />}
      <div className="play-card admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-lock-circle">
            <Lock size={30} />
          </div>
          <h2 className="admin-login-title">Admin Portal Login</h2>
          <p className="admin-login-subtitle">
            Secure authentication for educators & administrators
          </p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-login-form-group">
            <label htmlFor="admin-email-field" className="admin-login-label">Email Address</label>
            <input
              id="admin-email-field"
              type="email"
              placeholder="teacher@school.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="admin-login-input"
            />
          </div>

          <div className="admin-login-form-group">
            <label htmlFor="admin-pass-field" className="admin-login-label">Password</label>
            <input
              id="admin-pass-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="admin-login-input"
            />
          </div>

          {authError && (
            <span className="admin-login-error">
              {authError}
            </span>
          )}

          <button type="submit" className="btn btn-primary admin-login-submit">
            Log In to Portal
          </button>
        </form>

        <button
          onClick={() => setView("onboarding")}
          className="btn btn-gray admin-login-back"
        >
          Back to Student Screen
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
