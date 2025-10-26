// components/routines/SelfAckTodayRoutine.tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";

type Props = {
  onDone: () => void;
  onCancel?: () => void;
  guided?: boolean; // true면 프라이밍 10초 노출
};

const UI = {
  bg: "#FFFFFF",
  text: "#0F172A",
  sub: "#6B7280",
  chipBg: "#F1F5F9",
  chipOnBg: "#111827",
  chipOnText: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#111827",
  badgeBg: "#F5F3FF",
  badgeText: "#4C1D95",
};

const CANDIDATES = [
  "버텨냄","정리함","연락함","운동함","멈춰쉼","도전함","끝까지함","양보함","배려함",
  "집중함","정리정돈","착수함","피드백줌","피드백받음","연습함","학습함",
];

export default function SelfAckTodayRoutine({ onDone, onCancel, guided = true }: Props) {
  const [step, setStep] = useState<number>(guided ? 0 : 1);
  const [remain, setRemain] = useState<number>(guided ? 10 : 0);

  const [picked, setPicked] = useState<string[]>([]);
  const [custom1, setCustom1] = useState("");
  const [custom2, setCustom2] = useState("");
  const [difficulty, setDifficulty] = useState<number>(5);

  /** STEP 0: 프라이밍 타이머 */
  useEffect(() => {
    if (step !== 0) return;
    setRemain(10);
    const t = setInterval(() => {
      setRemain((s) => {
        if (s <= 1) {
          clearInterval(t);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep(1);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const toggle = (w: string) => {
    setPicked((arr) => (arr.includes(w) ? arr.filter((x) => x !== w) : [...arr, w]));
  };

  const todayBadge = useMemo(() => {
    const d = new Date();
    // 예: "10/23 오늘 수고"
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd} 오늘 수고`;
  }, []);

  const selected = useMemo(() => {
    const customs = [custom1, custom2].map((s) => s.trim()).filter(Boolean);
    const union = Array.from(new Set([...picked, ...customs]));
    return union.slice(0, 2); // 문장 가독성 위해 최대 2개만 표시
  }, [picked, custom1, custom2]);

  const sentence = useMemo(() => {
    if (selected.length === 0) return `나는 오늘을 버텨냈다. 난이도 ${difficulty}/10, 충분히 가치 있었다.`;
    return `나는 오늘 ${selected.join("·")} 을(를) 해냈다. 난이도 ${difficulty}/10, 충분히 가치 있었다.`;
  }, [selected, difficulty]);

  const handleNext = () => {
    Keyboard.dismiss();
    if (step === 0) {
      setStep(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (step === 1) {
      setStep(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    // step === 2
    try {
      console.log("[self_ack_today_saved]", { items: selected, difficulty });
      // track_event("self_ack_today", { items: selected, difficulty });
    } catch {}
    onDone();
  };

  const handleExit = () => onCancel?.() ?? onDone();

  /** STEP 0 */
  const renderStep0 = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: UI.bg }}>
      <Text style={{ fontSize: 20, fontWeight: "900", color: UI.text, marginBottom: 8 }}>한 번 깊게 숨</Text>
      <Text style={{ color: UI.sub, marginBottom: 20 }}>“오늘 했던 것 하나만 떠올려봐.”</Text>
      <Text style={{ fontSize: 48, fontWeight: "900", color: UI.text }}>{remain}</Text>
    </View>
  );

  /** 칩 */
  const Chip = ({ w }: { w: string }) => {
    const on = picked.includes(w);
    return (
      <TouchableOpacity
        key={w}
        onPress={() => toggle(w)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: on ? UI.chipOnBg : UI.chipBg,
          marginRight: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{ color: on ? UI.chipOnText : UI.text, fontWeight: "700" }}>{w}</Text>
      </TouchableOpacity>
    );
  };

  /** STEP 1 */
  const renderStep1 = () => (
    <View style={{ flex: 1, padding: 20, paddingTop: 40, backgroundColor: UI.bg }}>
      {/* 날짜 배지 */}
      <View style={{ alignSelf: "flex-start", backgroundColor: UI.badgeBg, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginBottom: 10 }}>
        <Text style={{ color: UI.badgeText, fontWeight: "800" }}>{todayBadge}</Text>
      </View>

      <Text style={{ fontSize: 18,  fontWeight: "900", color: UI.text, marginBottom: 6 }}>오늘 수고 인정하기</Text>
      <Text style={{ color: UI.sub, marginBottom: 12 }}>작아도 괜찮아요. “했던 것”을 적어볼까요?</Text>

      {/* 선택 미리보기 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        {selected.map((s) => (
          <View key={s} style={{ backgroundColor: "#E0F2FE", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
            <Text style={{ color: "#0C4A6E", fontWeight: "800" }}>{s}</Text>
          </View>
        ))}
      </View>

      {/* 칩들 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        {CANDIDATES.map((w) => (
          <Chip key={w} w={w} />
        ))}
      </View>

      {/* 직접 입력 2칸 */}
      <View style={{ marginBottom: 20 }}>
        <TextInput
          value={custom1}
          onChangeText={setCustom1}
          placeholder="예: 끝까지 참석함"
          returnKeyType="next"
          style={{ borderWidth: 1, borderColor: UI.border, borderRadius: 12, padding: 12, marginBottom: 8 }}
        />
        <TextInput
          value={custom2}
          onChangeText={setCustom2}
          placeholder="예: 하기 싫었지만 착수함"
          returnKeyType="done"
          style={{ borderWidth: 1, borderColor: UI.border, borderRadius: 12, padding: 12 }}
        />
      </View>

      {/* 난이도 슬라이더 */}
      <View style={{ marginTop: 4 }}>
        <Text style={{ color: UI.sub, marginBottom: 8 }}>체감 난이도: {difficulty}/10</Text>
        <Slider
          value={difficulty}
          onValueChange={(v) => setDifficulty(Math.round(v))}
          minimumValue={1}
          maximumValue={10}
          step={1}
        />
      </View>
    </View>
  );

  /** STEP 2 */
  const renderStep2 = () => (
    <View style={{ flex: 1, padding: 20, backgroundColor: UI.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 16, color: UI.sub, marginBottom: 8 }}>한 줄 자기인정</Text>
      <Text style={{ fontSize: 22, lineHeight: 30, fontWeight: "900", color: UI.text, textAlign: "center" }}>
        {sentence}
      </Text>
      <Text style={{ color: UI.sub, marginTop: 14 }}>작은 수고들이 오늘을 만들었어요.</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: UI.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1 }}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </View>

      {/* 하단 메인 액션 (다음=항상 진행) */}
      <View style={{ padding: 16, backgroundColor: UI.bg, borderTopWidth: 1, borderTopColor: UI.border }}>
        <TouchableOpacity
          accessibilityRole="button"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={handleNext}
          style={{
            backgroundColor: UI.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            {step === 2 ? "완료" : "다음"}
          </Text>
        </TouchableOpacity>

        
      </View>
    </KeyboardAvoidingView>
  );
}
