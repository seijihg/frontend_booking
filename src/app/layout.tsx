import "@/styles/globals.scss";

import UserStoreInitializer from "@/components/UserStoreInitiliazer";
import Providers from "@/utils/provider";
import { getSession } from "@/server/auth/session";
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
  const session = await getSession();
  const user = session?.user;

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
