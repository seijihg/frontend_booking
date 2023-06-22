"use client";

import { useUserStore } from "@/stores/userStore";

export default function Profile() {
  const { user } = useUserStore();

  return (
    <>
      <div>{user?.phone_number}</div>
    </>
  );
}
