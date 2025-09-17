// app/(onboarding)/step1-welcome.tsx
import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Image } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Step1Welcome() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 6, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [fade, scale, float]);

  const goNext = () => router.replace("/(onboarding)/step2-consents");

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0f1a", padding: 24, justifyContent: "center" }}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <Animated.View style={{ alignItems: "center", transform: [{ translateY: float }] }}>
          <Image source={require("@/assets/welcome.png")} style={{ width: 240, height: 240, marginBottom: 24 }} resizeMode="contain" />
        </Animated.View>

        <Text style={{ color: "white", fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 30 }}>
          감정 월드에 오신 걸 환영합니다 ✨{"\n"}
          여정을 함께 하시겠어요?
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="예, 시작할게요"
          onPress={goNext}
          style={{ marginTop: 28, alignSelf: "center", backgroundColor: "#8aa1ff", paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14 }}
        >
          <Text style={{ color: "#0b0f1a", fontWeight: "800" }}>예, 시작할게요</Text>
        </TouchableOpacity>

        {/* 이미 가입한 유저용 로그인 링크 */}
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: 16, alignSelf: "center" }}
        >
          <Text style={{ color: "#bbb", fontSize: 14, textDecorationLine: "underline" }}>
            이미 계정이 있어요
          </Text>
        </TouchableOpacity>

        {/* 그냥 둘러보기 (게스트 모드) */}
        <TouchableOpacity
          onPress={async () => {
            // 혹시 남아있을 수 있는 예전 세션 정리
            try { await supabase.auth.signOut(); } catch {}
            // 홈으로 진입 (게스트)
            router.replace("/");
          }}
          style={{ marginTop: 10, alignSelf: "center" }}
          accessibilityRole="button"
          accessibilityLabel="그냥 둘러보기"
        >
          <Text style={{ color: "#9aa7ff", fontSize: 14, textDecorationLine: "underline" }}>
            그냥 둘러보기
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
