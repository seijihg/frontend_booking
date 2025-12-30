import { redirect } from "next/navigation";
import getUser from "@/api/userApi";
import DashboardNavBar from "@/components/dashboard/navigation_bar/DashboardNavBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const data = await getUser();
  const user = data?.user;

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col">
      <DashboardNavBar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
