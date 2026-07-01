import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AccessibilityControls } from "./components/AccessibilityControls";
import Onboarding from "./views/student/Onboarding";
import Dashboard from "./views/student/Dashboard";
import GamePlayer from "./views/student/GamePlayer";
import AdminDashboard from "./views/admin/AdminDashboard";
import { KidsLoader } from "./components/KidsLoader";

const MainAppContent: React.FC = () => {
  const { currentView, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return <KidsLoader />;
  }

  const renderView = () => {
    switch (currentView) {
      case "onboarding":
        return <Onboarding />;
      case "dashboard":
        return <Dashboard />;
      case "game_player":
        return <GamePlayer />;
      case "admin_auth":
      case "admin_dashboard":
        return <AdminDashboard />;
      default:
        return <Onboarding />;
    }
  };

  return (
    <>
      {/* Dynamic main viewport area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
        {renderView()}
      </main>

      {/* Floating Accessibility settings for Dyslexic accessibility */}
      {currentView !== "game_player" && <AccessibilityControls />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
};

export default App;
