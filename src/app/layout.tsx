import "@/styles/globals.scss";

import UserStoreInitializer from "@/components/UserStoreInitiliazer";
import Providers from "@/utils/provider";
import getUser from "@/api/userApi";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Nails Booking App",
  description: "Booking app for Vietnamese community",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getUser();
  const user = data?.user;

  return (
    <html lang="en" className="h-full bg-white">
      <body className="h-full">
        <Providers>
          {user && <UserStoreInitializer user={user} />}
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
