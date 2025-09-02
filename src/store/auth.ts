import { create } from "zustand";

type S = { userId?: string; setUserId: (id?: string)=>void };
export const useAuth = create<S>((set)=>({
  userId: undefined,
  setUserId: (id) => set({ userId: id }),
}));
