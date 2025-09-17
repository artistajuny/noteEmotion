// /store/auth.ts  (변경 없음)
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

type AuthState = {
  userId: string | null;
  email: string | null;
  loading: boolean;
  setUserId: (v: string | null) => void;
  setEmail: (v: string | null) => void;
  init: () => Promise<void>;
  signOut: (opts?: { keepTrusted?: boolean }) => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  email: null,
  loading: false,
  setUserId: (v) => set({ userId: v }),
  setEmail: (v) => set({ email: v }),
  init: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
      });
    } finally {
      set({ loading: false });
    }
  },
  signOut: async (opts) => {
    const keepTrusted = opts?.keepTrusted ?? true; // 기본: 신뢰기기 보존
    // 1) 세션 종료
    await supabase.auth.signOut();
    // 2) 신뢰기기 키 정리 옵션
    if (!keepTrusted) {
      await AsyncStorage.multiRemove(["trusted_device", "last_login_email"]);
    }
    // 3) 로컬 상태 초기화
    set({ userId: null, email: null });
  },
}));

// 세션 변화에 따라 전역 상태 갱신
supabase.auth.onAuthStateChange((_event, session) => {
  useAuth.setState({
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
  });
});
