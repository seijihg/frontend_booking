import Redirect from "@/components/Redirect";
import Profile from "@/components/dashboard/Profile";
import NavBar from "@/components/dashboard/navigation_bar/NavBar";
import { useUserStore } from "@/stores/userStore";

export default async function Dashboard() {
  const user = useUserStore.getState().user;
  if (!user) {
    // SSR nextjs 13 is not working this is workaround to redirect from server
    // https://github.com/vercel/next.js/issues/42556
    return <Redirect url="/login" />;
  }

  return (
    <>
      <NavBar />
      <Profile />
    </>
  );
}
