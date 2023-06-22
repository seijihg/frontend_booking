import { create } from "zustand";
import { User } from "@/types/user";

type UserState = {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));