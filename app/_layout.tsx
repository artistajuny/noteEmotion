// app/_layout.tsx
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

function SessionSync() {
  const setUserId = useAuth((s) => s.setUserId);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <SessionSync />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
