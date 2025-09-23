// app/(auth)/login.tsx
import React, { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);

  // 이메일로 6자리 코드 전송
  const sendOtp = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) return Alert.alert("안내", "이메일을 입력해주세요.");
    try {
      setSending(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: mail,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setSent(true);
      Alert.alert("코드 전송", "메일로 6자리 코드를 보냈어요.");
    } catch (e: any) {
      Alert.alert("전송 실패", e?.message ?? "다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  // 코드 검증 → 세션 생성 → app_user 업서트 → 홈
  const verifyCode = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail || !code) return Alert.alert("안내", "이메일과 코드를 입력해주세요.");
    try {
      setVerifying(true);
      const { error } = await supabase.auth.verifyOtp({
        email: mail,
        token: code,
        type: "email",
      });
      if (error) throw error;

      // 접속 기록/최초 행 생성(정책: id = auth.uid())
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user;
      if (u) {
        await supabase.from("app_user").upsert(
          { id: u.id, email: u.email ?? mail, last_seen_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      }

      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("인증 실패", e?.message ?? "코드를 확인해주세요.");
    } finally {
      setVerifying(false);
    }
  };

  const goSignup = () => router.replace("/(onboarding)/step1-welcome");

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>로그인</Text>

      {/* 이메일 */}
      <TextInput
        placeholder="이메일 주소"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!sent}
        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, opacity: sent ? 0.6 : 1 }}
      />

      {/* 코드 전송/재전송 */}
      {!sent ? (
        <TouchableOpacity
          disabled={sending}
          onPress={sendOtp}
          style={{ backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>인증 코드 보내기</Text>}
        </TouchableOpacity>
      ) : (
        <>
          {/* 코드 입력 */}
          <TextInput
            placeholder="6자리 코드"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10 }}
          />

          <TouchableOpacity
            disabled={verifying}
            onPress={verifyCode}
            style={{ backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center", opacity: verifying ? 0.6 : 1 }}
          >
            {verifying ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>코드 확인하고 로그인</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={sendOtp} disabled={sending} style={{ alignSelf: "center", marginTop: 8 }}>
            <Text style={{ color: "#3a46d3", textDecorationLine: "underline" }}>코드 재전송</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 12 }} />

      <TouchableOpacity onPress={goSignup} style={{ alignSelf: "center" }}>
        <Text style={{ color: "#8aa1ff", fontWeight: "700" }}>처음이에요 · 회원가입하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}
