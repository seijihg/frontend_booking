import UserStoreInitializer from "@/components/UserStoreInitiliazer";
import "@/styles/globals.scss";
import Providers from "@/utils/provider";
import { useUserStore } from "@/stores/userStore";
import getUser from "@/api/userApi";

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getUser();
  const user = data?.user;
  useUserStore.setState({ user: user });

  return (
    <html lang="en" className="h-full bg-white">
      <body className="h-full">
        <UserStoreInitializer user={user} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
