// app.config.ts
import { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "emotion-app",
  slug: "emotion-app",
  version: "1.0.0",
  scheme: "emotionapp",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: "com.byeonjunseok.emotionapp",
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [
    [
      "expo-build-properties",
      {
        android: { minSdkVersion: 24 },
      },
    ],
  ],
});
