// app/_layout.tsx  ── 딥링크로 열린 URL을 세션으로 교환
import { useEffect } from "react";
import { Linking } from "react-native";
import { Slot, router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    const handleUrl = async (url?: string | null) => {
      if (!url) return;
      // 이메일 매직링크/OTP로 열린 딥링크를 Supabase 세션으로 교환
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (!error) {
        // 온보딩 중이면 다음 단계로, 일반 진입이면 홈으로 라우팅해도 됨
        // 필요시 커스텀 분기 추가
      }
    };

    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    Linking.getInitialURL().then((u) => handleUrl(u));

    return () => sub.remove();
  }, []);

  return <Slot />;
}
