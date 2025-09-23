// app/(onboarding)/step3-email.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export default function Step3Email() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const emailDebounce = useRef<NodeJS.Timeout | null>(null);

  // 이메일 존재 여부 표시용
  useEffect(() => {
    if (emailDebounce.current) clearTimeout(emailDebounce.current);
    const mail = email.trim().toLowerCase();
    if (!mail) { setEmailExists(null); return; }
    emailDebounce.current = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const { data, error } = await supabase.rpc("email_exists", { p_email: mail });
        if (error) throw error;
        setEmailExists(Boolean(data));
      } catch { setEmailExists(null); }
      finally { setEmailChecking(false); }
    }, 300);
  }, [email]);

  // OTP 전송
  const sendOtp = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) return Alert.alert("안내", "이메일을 입력해주세요.");
    try {
      setSending(true);
      await AsyncStorage.setItem("ob_email_input", mail);
      const { error } = await supabase.auth.signInWithOtp({
        email: mail,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setSent(true);
      Alert.alert("인증 코드 전송", "메일로 6자리 코드가 전송되었어요.");
    } catch (e: any) {
      Alert.alert("전송 실패", e?.message ?? "다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  // 코드 검증 → 세션 생성 → app_user 업서트 → step4
  const verifyCode = async () => {
    const mail = (email || (await AsyncStorage.getItem("ob_email_input")) || "").trim().toLowerCase();
    if (!mail || !code) return Alert.alert("안내", "이메일과 코드를 입력해주세요.");
    try {
      setVerifying(true);
      const { error } = await supabase.auth.verifyOtp({ email: mail, token: code, type: "email" });
      if (error) throw error;
      await finalizeOnboarding();
    } catch (e: any) {
      Alert.alert("인증 실패", e?.message ?? "코드를 확인해주세요.");
    } finally {
      setVerifying(false);
    }
  };

  // 온보딩 마무리: 이메일만 기록(닉네임은 가입 후 설정)
  const finalizeOnboarding = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return Alert.alert("오류", "세션이 없어요. 다시 시도해주세요.");

    const uid = user.id;
    const pairs = await AsyncStorage.multiGet([
      "ob_consents_terms","ob_consents_privacy","ob_consents_marketing",
      "ob_terms_ver","ob_privacy_ver","ob_email_input",
    ]);
    const map = Object.fromEntries(pairs);

    const consent_required_terms = JSON.parse(map["ob_consents_terms"] ?? "false");
    const consent_privacy        = JSON.parse(map["ob_consents_privacy"] ?? "false");
    const consent_marketing      = JSON.parse(map["ob_consents_marketing"] ?? "false");
    const terms_version          = map["ob_terms_ver"] ?? "v1";
    const privacy_version        = map["ob_privacy_ver"] ?? "v1";
    const savedEmailInput        = (map["ob_email_input"] ?? "").trim();
    const finalEmail             = user.email ?? savedEmailInput ?? email.trim().toLowerCase();

    const { error: upErr } = await supabase.from("app_user").upsert(
      {
        id: uid,
        email: finalEmail,
        consent_required_terms,
        consent_privacy,
        consent_marketing,
        terms_version,
        privacy_version,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (upErr) return Alert.alert("저장 실패", upErr.message);

    await AsyncStorage.removeItem("ob_email_input");
    router.push("/(onboarding)/step4-done");
  };

  return (
    <View style={{ flex:1, padding:20, justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>이메일 인증(코드)</Text>

      {/* 이메일 입력 (코드 전송 후엔 잠금) */}
      <TextInput
        placeholder="이메일 주소"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!sent}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10, opacity: sent ? 0.6 : 1 }}
      />
      {emailChecking ? (
        <Text style={{ color:"#888", fontSize:12 }}>이메일 확인 중…</Text>
      ) : emailExists === null ? null : emailExists ? (
        <Text style={{ color:"#555", fontSize:12 }}>이미 가입된 이메일입니다. 로그인 코드가 전송됩니다.</Text>
      ) : (
        <Text style={{ color:"#555", fontSize:12 }}>처음 가입이면 가입 코드가 전송됩니다.</Text>
      )}

      {/* 단계별 버튼 */}
      {!sent ? (
        <TouchableOpacity
          disabled={sending}
          onPress={sendOtp}
          style={{ backgroundColor:"#111", padding:14, borderRadius:12, opacity: sending?0.6:1 }}
        >
          {sending ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color:"#fff", textAlign:"center", fontWeight:"700" }}>인증 코드 보내기</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            placeholder="6자리 코드"
            value={code}
            onChangeText={(t)=>setCode(t.replace(/\D/g,""))}
            keyboardType="number-pad"
            maxLength={6}
            style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10 }}
          />
          <TouchableOpacity
            disabled={verifying}
            onPress={verifyCode}
            style={{ backgroundColor:"#111", padding:14, borderRadius:12, opacity: verifying?0.6:1 }}
          >
            {verifying ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color:"#fff", textAlign:"center", fontWeight:"700" }}>코드 확인하고 진행</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={sendOtp} disabled={sending} style={{ alignSelf:"center", padding:8 }}>
            <Text style={{ color:"#3a46d3", textDecorationLine:"underline" }}>
              코드 재전송
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={{ color:"#888", fontSize:12, textAlign:"center" }}>
        메일의 6자리 코드를 입력하면 가입/로그인이 완료됩니다.
      </Text>
    </View>
  );
}
