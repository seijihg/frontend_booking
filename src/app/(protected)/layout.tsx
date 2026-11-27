import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import DashboardNavBar from "@/components/dashboard/navigation_bar/DashboardNavBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const session = await getSession();
  const user = session?.user;

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
