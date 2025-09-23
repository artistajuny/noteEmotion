// app/index.tsx
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const [dest, setDest] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setDest("/(tabs)");                 // 로그인 유지 → 탭
        } else {
          setDest("/(onboarding)/step1-welcome"); // ✅ 세션 없으면 무조건 온보딩
        }
      } catch {
        setDest("/(onboarding)/step1-welcome");
      }
    })();
  }, []);

  if (!dest) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={dest} />;
}
