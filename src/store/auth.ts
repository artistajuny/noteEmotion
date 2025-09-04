import { create } from "zustand";

type AuthState = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
}));
