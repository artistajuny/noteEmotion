// app/_layout.tsx
import { useEffect } from "react";
import { Linking, Platform } from "react-native";
import { Slot, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import type { NotificationBehavior } from "expo-notifications";

// ✅ 앱 포그라운드에서도 알림 보이도록(기본은 무음/무표시일 수 있음)
const notificationBehavior: NotificationBehavior = {
  // shouldShowAlert: true,   // ❌ 제거 (deprecated)
  shouldPlaySound: true,
  shouldSetBadge: false,
  shouldShowBanner: true, // iOS
  shouldShowList: true,   // iOS
};

Notifications.setNotificationHandler({
  handleNotification: async () => notificationBehavior,
});

export default function RootLayout() {
  useEffect(() => {
    // ── 딥링크로 열린 URL을 세션으로 교환(기존)
    const handleUrl = async (url?: string | null) => {
      if (!url) return;
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (!error) {
        // 필요 시 온보딩/홈 라우팅 분기
      }
    };
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    Linking.getInitialURL().then((u) => handleUrl(u));

    // ── ✅ 알림 권한 & 안드로이드 채널 준비
    (async () => {
      await Notifications.requestPermissionsAsync();
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("smallplan", {
          name: "SmallPlan",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 200, 100, 200],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    })();

    // ── ✅ 알림 탭/액션 응답 핸들링 (예: 스몰플랜 완료/시작 등)
    const respSub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as any;
      // 필요 시 딥링크 라우팅
      // 예) 완료 알림 눌렀을 때 히스토리/리포트로 이동
      if (data?.type === "smallplan_done") {
        router.push("/reports"); // 원하는 경로로 교체
      }
      // 예) 시작 알림 눌렀을 때 실행 화면
      if (data?.type === "smallplan_start") {
        router.push("/"); // 홈 등
      }
    });

    return () => {
      sub.remove();
      respSub.remove();
    };
  }, []);

  return <Slot />;
}
