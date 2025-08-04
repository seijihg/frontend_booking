"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CalendarView from "@/components/calendar/CalendarView";
import NavBar from "@/components/dashboard/navigation_bar/NavBar";
import { useUserStore } from "@/stores/userStore";
import DashboardView from "../profile/DashboardView";

type ViewType = "dashboard" | "calendar" | "team" | "projects";

export default function MainComponent() {
  const router = useRouter();
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false); //change to true if useEffect
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  // useEffect(() => {
  //   console.log(user);
  //   if (!user) {
  //     router.push("/login");
  //   } else {
  //     setIsLoading(false);
  //   }
  // }, [user, router]);

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
    !isLoading && (
      <div className="flex h-screen flex-col">
        <NavBar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </div>
    )
  );
}
