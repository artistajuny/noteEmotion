// app/(onboarding)/step3-email.tsx
import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

const EMAIL_REDIRECT = "emotionapp://callback";

export default function Step3Email() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const [nameChecking, setNameChecking] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  const nameDebounce = useRef<NodeJS.Timeout | null>(null);
  const emailDebounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        const metaName = (((session?.user?.user_metadata as any)?.display_name ?? "") + "").trim();
        finalizeOnboarding(metaName);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 닉네임 중복 체크
  useEffect(() => {
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    const nick = name.trim();
    if (!nick) { setNameAvailable(null); return; }

    nameDebounce.current = setTimeout(async () => {
      setNameChecking(true);
      try {
        const { data, error } = await supabase.rpc("is_display_name_available", { p_name: nick });
        if (error) throw error;
        setNameAvailable(Boolean(data));
      } catch {
        setNameAvailable(null);
      } finally {
        setNameChecking(false);
      }
    }, 300);
  }, [name]);

  // 이메일 가입 여부 체크
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
      } catch {
        setEmailExists(null);
      } finally {
        setEmailChecking(false);
      }
    }, 300);
  }, [email]);

  const sendMagicLink = async () => {
    const nick = name.trim();
    const mail = email.trim().toLowerCase();
    if (!nick || !mail) return Alert.alert("안내", "닉네임과 이메일을 입력해주세요.");

    try {
      // 닉네임 가용성
      const nickCheck = await supabase.rpc("is_display_name_available", { p_name: nick });
      if (nickCheck.error) throw nickCheck.error;
      if (!nickCheck.data) return Alert.alert("닉네임 사용 불가", "이미 사용 중인 닉네임입니다.");

      // 이메일 가입 여부
      const emailCheck = await supabase.rpc("email_exists", { p_email: mail });
      if (emailCheck.error) throw emailCheck.error;
      const existing = Boolean(emailCheck.data);

      // ✅ (추가 1) 사용자가 입력한 닉네임/이메일을 보관
      await AsyncStorage.multiSet([
        ["ob_nickname", nick],
        ["ob_email_input", mail],
      ]);

      setSending(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: mail,
        options: {
          emailRedirectTo: EMAIL_REDIRECT,
          data: { display_name: nick },
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      Alert.alert(
        existing ? "로그인 링크 전송" : "가입 링크 전송",
        existing
          ? "이미 가입된 이메일입니다. 메일의 로그인 버튼을 눌러 로그인하세요."
          : "처음 가입하는 이메일입니다. 메일의 확인 버튼을 눌러 인증을 완료하세요."
      );
    } catch (e: any) {
      Alert.alert("전송 실패", e?.message ?? "다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  // metaName 인자를 받아 닉네임 우선순위로 사용
  const finalizeOnboarding = async (metaName?: string) => {
    try {
      setChecking(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const uid = user.id;
      const pairs = await AsyncStorage.multiGet([
        "ob_consents_terms","ob_consents_privacy","ob_consents_marketing",
        "ob_terms_ver","ob_privacy_ver",
        // ✅ (추가 2) 저장해둔 닉네임/이메일도 함께 읽기
        "ob_nickname","ob_email_input",
      ]);
      const map = Object.fromEntries(pairs);

      const consent_required_terms = JSON.parse(map["ob_consents_terms"] ?? "false");
      const consent_privacy        = JSON.parse(map["ob_consents_privacy"] ?? "false");
      const consent_marketing      = JSON.parse(map["ob_consents_marketing"] ?? "false");
      const terms_version          = map["ob_terms_ver"] ?? "v1";
      const privacy_version        = map["ob_privacy_ver"] ?? "v1";

      const savedNick        = (map["ob_nickname"] ?? "").trim();
      const savedEmailInput  = (map["ob_email_input"] ?? "").trim();

      // 닉네임 결정: 저장값 → 입력값 → 콜백 메타 → 세션 메타 → 이메일ID → "."
      const inputName        = (name ?? "").trim();
      const metaFromCallback = (metaName ?? "").trim();
      const metaFromSession  = ((((user.user_metadata as any)?.display_name) ?? "") + "").trim();
      const fallbackFromEmail= (user.email?.split("@")[0] ?? "").trim();

      const display_name =
        savedNick || inputName || metaFromCallback || metaFromSession || fallbackFromEmail || ".";

      const finalEmail = user.email ?? savedEmailInput ?? email.trim().toLowerCase();

      const { error: upErr } = await supabase.from("app_user").upsert(
        {
          id: uid,
          email: finalEmail,
          display_name,
          consent_required_terms,
          consent_privacy,
          consent_marketing,
          terms_version,
          privacy_version,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (upErr) throw upErr;

      // ✅ (추가 3) 사용했던 임시값 정리
      await AsyncStorage.multiRemove(["ob_nickname","ob_email_input"]);

      router.replace("/(onboarding)/step4-done");
    } catch (e: any) {
      Alert.alert("처리 실패", e?.message ?? "온보딩 마무리에 실패했습니다.");
    } finally {
      setChecking(false);
    }
  };

  const manualCheck = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return Alert.alert("안내","아직 이메일 인증이 완료되지 않았어요. 메일의 로그인 버튼을 눌러주세요.");
    await finalizeOnboarding(name.trim());
  };

  return (
    <View style={{ flex:1, padding:20, justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>닉네임 & 이메일 인증</Text>

      <TextInput
        placeholder="닉네임"
        value={name}
        onChangeText={setName}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10 }}
      />
      {nameChecking ? (
        <Text style={{ color:"#888", fontSize:12 }}>닉네임 확인 중…</Text>
      ) : nameAvailable === null ? null : nameAvailable ? (
        <Text style={{ color:"#2e7d32", fontSize:12 }}>사용 가능한 닉네임이에요.</Text>
      ) : (
        <Text style={{ color:"#c62828", fontSize:12 }}>이미 사용 중인 닉네임입니다.</Text>
      )}

      <TextInput
        placeholder="이메일 주소"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10 }}
      />
      {emailChecking ? (
        <Text style={{ color:"#888", fontSize:12 }}>이메일 확인 중…</Text>
      ) : emailExists === null ? null : emailExists ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: "#555", fontSize: 12 }}>이미 가입된 이메일입니다.</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={{ color: "#8aa1ff", fontSize: 12, textDecorationLine: "underline" }}>
              로그인하러가기
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={{ color:"#555", fontSize:12 }}>처음 가입하는 이메일입니다. 인증 후 계정이 생성됩니다.</Text>
      )}

      <TouchableOpacity
        disabled={sending}
        onPress={sendMagicLink}
        style={{ backgroundColor:"#111", padding:14, borderRadius:12, opacity: sending?0.6:1 }}
      >
        {sending ? <ActivityIndicator color="#fff" /> : (
          <Text style={{ color:"#fff", textAlign:"center", fontWeight:"700" }}>로그인</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        disabled={checking}
        onPress={manualCheck}
        style={{ backgroundColor:"#444", padding:14, borderRadius:12, opacity: checking?0.6:1 }}
      >
        {checking ? <ActivityIndicator color="#fff" /> : (
          <Text style={{ color:"#fff", textAlign:"center" }}>이미 인증했어요</Text>
        )}
      </TouchableOpacity>

      <Text style={{ color:"#888", fontSize:12, textAlign:"center" }}>
        메일의 로그인 버튼을 누르면 앱으로 복귀하며 자동으로 가입이 완료됩니다.
      </Text>
    </View>
  );
}
