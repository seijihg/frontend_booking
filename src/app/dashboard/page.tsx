import { redirect } from "next/navigation";
import getUser from "@/api/userApi";
import MainComponent from "@/components/dashboard/MainComponent";

export default async function Dashboard() {
  // Check authentication server-side
  const data = await getUser();
  const user = data?.user;

  // If no user, redirect to login server-side
  if (!user) {
    redirect("/login");
  }

  // If user exists, render the dashboard
  return <MainComponent />;
}