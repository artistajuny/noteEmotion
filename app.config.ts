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
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    package: "com.byeonjunseok.emotionapp",
    // ✅ 알림/진동/부팅 후 예약 알림 유지 권한
    permissions: ["VIBRATE", "RECEIVE_BOOT_COMPLETED", "WAKE_LOCK"],
  },
  web: { favicon: "./assets/favicon.png" },
  plugins: [
    [
      "expo-build-properties",
      {
        android: { minSdkVersion: 24 },
      },
    ],
    // ✅ 로컬 알림 설정(안드로이드 채널/아이콘/색 등)
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",   // 있으면 지정, 없으면 생략 가능
        color: "#111827",                         // 알림 아이콘 틴트
        sounds: [],                               // 커스텀 사운드 쓸 거면 파일 경로 배열
      },
    ],
  ],
});
