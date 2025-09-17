import { Mixpanel } from "mixpanel-react-native";

const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? "";
const client = new Mixpanel(token, true);
client.init();

export const track = (name: string, props?: Record<string, any>) => {
  try { client.track(name, props); } catch {}
};
