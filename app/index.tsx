import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";

export default function Index() {
  const userId = useAuth((s) => s.userId);
  if (!userId) return <Redirect href="/onboarding" />;
  return <Redirect href="/home" />;
}
