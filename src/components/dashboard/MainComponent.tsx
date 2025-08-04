"use client";
import { useState } from "react";

import CalendarView from "@/components/calendar/CalendarView";
import NavBar from "@/components/dashboard/navigation_bar/NavBar";
import DashboardView from "../profile/DashboardView";

type ViewType = "dashboard" | "calendar" | "team" | "projects";

export default function MainComponent() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "calendar":
        return <CalendarView />;
      case "team":
        return (
          <div className="p-8 text-gray-500">Team view coming soon...</div>
        );
      case "projects":
        return (
          <div className="p-8 text-gray-500">Projects view coming soon...</div>
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <NavBar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
}