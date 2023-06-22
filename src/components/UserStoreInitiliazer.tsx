"use client";

import { useUserStore } from "@/stores/userStore";
import { useRef } from "react";
import { User } from "@/types/user";

interface UserProps {
  user: User;
}

function UserStoreInitializer({ user }: UserProps) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useUserStore.setState({ user: user });
    initialized.current = true;
  }
  return null;
}

export default UserStoreInitializer;
