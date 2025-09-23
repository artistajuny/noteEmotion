// app/(onboarding)/step2-consents.tsx
import { useState } from "react";
import { View, Text, Switch, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Step2Consents() {
  const [t, setT] = useState(false);
  const [p, setP] = useState(false);
  const [m, setM] = useState(false);

  const onNext = async () => {
    if (!t || !p) return Alert.alert("안내", "필수 동의를 체크해주세요");
    await AsyncStorage.multiSet([
      ["ob_consents_terms", JSON.stringify(t)],
      ["ob_consents_privacy", JSON.stringify(p)],
      ["ob_consents_marketing", JSON.stringify(m)],
      ["ob_terms_ver", "v1"],
      ["ob_privacy_ver", "v1"],
    ]);
    router.push("/(onboarding)/step3-email");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>개인정보 동의</Text>

      <Row label="[필수] 이용약관 동의" v={t} s={setT} />
      <Row label="[필수] 개인정보 수집·이용 동의" v={p} s={setP} />
      <Row label="[선택] 마케팅 알림 동의" v={m} s={setM} />

      <TouchableOpacity onPress={onNext} style={{ backgroundColor: "#111", padding: 14, borderRadius: 12 }}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, v, s }: { label: string; v: boolean; s: (b: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text>{label}</Text>
      <Switch value={v} onValueChange={s} />
    </View>
  );
}
