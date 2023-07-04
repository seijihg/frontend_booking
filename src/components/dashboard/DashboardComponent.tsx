"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Profile from "@/components/dashboard/Profile";
import NavBar from "@/components/dashboard/navigation_bar/NavBar";
import { useUserStore } from "@/stores/userStore";

export default function DashboardComponent() {
  const router = useRouter();
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(user);
    if (!user) {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  return (
    !isLoading && (
      <>
        <NavBar />
        <Profile />
      </>
    )
  );
}
