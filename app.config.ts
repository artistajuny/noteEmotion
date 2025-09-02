export default {
  name: "emotion-app",
  slug: "emotion-app",
  scheme: "emotion",
  plugins: ["expo-router"],
  android: {
    package: "com.anonymous.emotionapp",
  },
  ios: {
    bundleIdentifier: "com.anonymous.emotionapp", // ✅ iOS 번들 아이디
  },
} as const;
