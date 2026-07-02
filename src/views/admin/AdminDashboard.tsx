import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LocalDB from "../../services/db";
import type { Game, ActivityLog, Student, GameRequest, PaymentRecord } from "../../services/db";
import KidsLoader from "../../components/KidsLoader";
import {
  BarChart3,
  Cpu,
  BookOpen,
  History,
  Settings as SettingsIcon,
  Lightbulb,
  CreditCard
} from "lucide-react";
import AdminLogin from "../../components/admin/AdminLogin";
import AdminHeader from "../../components/admin/AdminHeader";
import TabOverview from "../../components/admin/TabOverview";
import TabStudio from "../../components/admin/TabStudio";
import TabAllGames from "../../components/admin/TabAllGames";
import TabRequests from "../../components/admin/TabRequests";
import TabAnalytics from "../../components/admin/TabAnalytics";
import TabSettings from "../../components/admin/TabSettings";
import TabPayments from "../../components/admin/TabPayments";

import "./AdminDashboard.css";

export const AdminDashboard: React.FC = () => {
  const {
    isAdminLoggedIn,
    logOutAdmin,
    setView
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<"stats" | "studio" | "games" | "analytics" | "requests" | "settings" | "payments">("stats");

  // Database lists
  const [students, setStudents] = useState<Student[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [gameRequests, setGameRequests] = useState<GameRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // States
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadData();
    }
  }, [isAdminLoggedIn]);

  const loadData = async () => {
    setIsDataLoading(true);
    // Pre-populate defaults under authenticated admin context
    await LocalDB.prepopulateDefaultGames();

    try {
      const [studentsList, gamesList, logsList, requestsList, paymentsList] = await Promise.all([
        LocalDB.getStudents(),
        LocalDB.getGames(),
        LocalDB.getLogs(),
        LocalDB.getGameRequests(),
        LocalDB.getAllPaymentRecords()
      ]);

      // Sort lists by updatedBy / Recent (newest first)
      const sortedStudents = [...studentsList].sort(
        (a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime()
      );
      const sortedGames = [...gamesList].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const sortedLogs = [...logsList].sort(
        (a, b) => new Date(b.finishTime || b.startTime || 0).getTime() - new Date(a.finishTime || a.startTime || 0).getTime()
      );
      const sortedRequests = [...requestsList].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setStudents(sortedStudents);
      setGames(sortedGames);
      setLogs(sortedLogs);
      setGameRequests(sortedRequests);
      setPayments(paymentsList);
    } catch (e) {
      console.error("loadData failed in AdminDashboard:", e);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Render Login view if not logged in
  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  // Render Admin Dashboard layout
  return (
    <div className="admin-container animate-slide-up">
      {isDataLoading && <KidsLoader />}

      {/* Admin Header */}
      <AdminHeader setView={setView} logOutAdmin={logOutAdmin} />

      {/* Tabs Menu */}
      <div className="admin-tabs-menu">
        {[
          { id: "stats", label: "Overview", icon: <BarChart3 size={18} /> },
          { id: "studio", label: "AI Studio", icon: <Cpu size={18} /> },
          { id: "games", label: "All Games", icon: <BookOpen size={18} /> },
          { id: "requests", label: "Student Ideas", icon: <Lightbulb size={18} /> },
          { id: "analytics", label: "Analytics", icon: <History size={18} /> },
          { id: "payments", label: "Payments", icon: <CreditCard size={18} /> },
          { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id !== "studio") {
                setEditingGame(null);
              }
            }}
            className={`btn admin-tab-btn ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="admin-content-container">

        {/* TAB 1: OVERVIEW STATS */}
        {activeTab === "stats" && (
          <TabOverview
            students={students}
            gamesCount={games.length}
            logsCount={logs.length}
            onRefresh={loadData}
          />
        )}

        {/* TAB 2: AI STUDIO (GAME GENERATION) */}
        {activeTab === "studio" && (
          <TabStudio
            editingGame={editingGame}
            onCancelEdit={() => {
              setEditingGame(null);
              setActiveTab("games");
            }}
            onPublishOrSave={() => {
              setEditingGame(null);
              loadData();
              setActiveTab("games");
            }}
            students={students}
          />
        )}

        {/* TAB 3: ALL PUBLISHED GAMES */}
        {activeTab === "games" && (
          <TabAllGames
            games={games}
            onEditGame={(game) => {
              setEditingGame(game);
              setActiveTab("studio");
            }}
            onRefresh={loadData}
          />
        )}

        {/* TAB 4: STUDENT IDEAS & REQUESTS */}
        {activeTab === "requests" && (
          <TabRequests
            gameRequests={gameRequests}
            onRefresh={loadData}
          />
        )}

        {/* TAB 5: ANALYTICS REPORTS */}
        {activeTab === "analytics" && (
          <TabAnalytics
            logs={logs}
          />
        )}

        {/* TAB 7: PAYMENTS */}
        {activeTab === "payments" && (
          <TabPayments
            payments={payments}
            onRefresh={loadData}
          />
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <TabSettings />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
