import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "onboarding_done";

export const setOnboardingDone = async () => {
  try { await AsyncStorage.setItem(KEY, "1"); } catch {}
};

export const isOnboardingDone = async () => {
  try { return (await AsyncStorage.getItem(KEY)) === "1"; } catch { return false; }
};
