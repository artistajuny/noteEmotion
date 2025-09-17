// app/(auth)/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async () => {
    try {
      if (!email.trim()) return Alert.alert("안내", "이메일을 입력해주세요.");
      setLoading(true);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,                 // 없으면 자동 가입
          emailRedirectTo: "emotionapp://callback", // 앱 스킴(프로젝트에 맞게 유지)
        },
      });
      if (error) throw error;

      Alert.alert("안내", "메일로 보낸 로그인 링크를 눌러주세요.");
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const alreadyVerified = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        return Alert.alert("안내", "아직 로그인 세션이 없어요. 메일 링크를 먼저 눌러주세요.");
      }

      // 접속 기록/최초 행 생성
      await supabase.rpc("app_user_touch_or_create");

      // 홈으로 이동
      router.replace("/");
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const goSignup = () => router.replace("/(onboarding)/step1-welcome");

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>로그인</Text>

      <TextInput
        placeholder="이메일 주소"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10 }}
      />

      <TouchableOpacity
        disabled={loading}
        onPress={sendMagicLink}
        style={{
          backgroundColor: "#111",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          opacity: loading ? 0.6 : 1,
        }}
        accessibilityRole="button"
        accessibilityLabel="로그인 링크 보내기"
      >
        {loading ? <ActivityIndicator /> : <Text style={{ color: "#fff", fontWeight: "700" }}>로그인 링크 보내기</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={alreadyVerified} style={{ alignSelf: "center", marginTop: 10 }}>
        <Text style={{ color: "#666", textDecorationLine: "underline" }}>이미 인증했어요</Text>
      </TouchableOpacity>

      <View style={{ height: 12 }} />

      <TouchableOpacity onPress={goSignup} style={{ alignSelf: "center" }}>
        <Text style={{ color: "#8aa1ff", fontWeight: "700" }}>처음이에요 · 회원가입하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}
