// components/routines/Strengths3Routine.tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
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
};

const CANDIDATES = [
  "성실함","꾸준함","배려","유머","문제해결","집중력","회복탄력성","책임감","호기심",
  "공감","결단력","학습력","소통","인내심","적응력","체계성","긍정성","창의성",
];

export default function Strengths3Routine({ onDone, onCancel, guided = true }: Props) {
  const [step, setStep] = useState<number>(guided ? 0 : 1);
  const [remain, setRemain] = useState<number>(guided ? 10 : 0);

  // 선택/작성
  const [picked, setPicked] = useState<string[]>([]);
  const [custom1, setCustom1] = useState("");
  const [custom2, setCustom2] = useState("");
  const [custom3, setCustom3] = useState("");

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

  /** 칩 토글 */
  const toggle = (w: string) => {
    setPicked((arr) => {
      if (arr.includes(w)) return arr.filter((x) => x !== w);
      return [...arr, w];
    });
  };

  /** 표시용 선택(중복 제거, 최대 3개) */
  const selected = useMemo(() => {
    const customs = [custom1, custom2, custom3].map((s) => s.trim()).filter(Boolean);
    const union = Array.from(new Set([...picked, ...customs]));
    return union.slice(0, 3);
  }, [picked, custom1, custom2, custom3]);

  /** 확언 문구 (없으면 가벼운 기본문구) */
  const affirmation = useMemo(() => {
    if (selected.length === 0) return "나는 나답게 충분해.";
    return `나는 ${selected.join("·")} 를(을) 가진 사람, 오늘도 충분해.`;
  }, [selected]);

  /** 다음(=건너뛰기처럼 항상 진행) */
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
      console.log("[strengths3_saved]", selected);
      // track_event("strengths3_saved", { items: selected });
    } catch {}
    onDone();
  };

  /** 종료 */
  const handleExit = () => {
    onCancel?.() ?? onDone();
  };

  /** STEP 0 화면 */
  const renderStep0 = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: UI.bg }}>
      <Text style={{ fontSize: 20, fontWeight: "900", color: UI.text, marginBottom: 8 }}>한 번 깊게 숨</Text>
      <Text style={{ color: UI.sub, marginBottom: 20 }}>“오늘의 ‘나다운 점’ 3가지만 고르자.”</Text>
      <Text style={{ fontSize: 48, fontWeight: "900", color: UI.text }}>{remain}</Text>
    </View>
  );

  /** 칩 */
  const renderChip = (w: string) => {
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

  /** STEP 1 화면 */
  const renderStep1 = () => (
    <View style={{ flex: 1, padding: 20, backgroundColor: UI.bg }}>
      <Text style={{ fontSize: 18, paddingTop: 40, fontWeight: "900", color: UI.text, marginBottom: 6 }}>나의 강점 3가지</Text>
      <Text style={{ color: UI.sub, marginBottom: 12 }}>완벽할 필요 없어요. 지금의 ‘나’에서 보이는 것.</Text>

      {/* 선택된 미리보기 */}
      <View style={{ flexDirection: "row", marginBottom: 12, flexWrap: "wrap" }}>
        {selected.map((s) => (
          <View key={s} style={{ backgroundColor: "#EEF2FF", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
            <Text style={{ color: "#3730A3", fontWeight: "800" }}>{s}</Text>
          </View>
        ))}
      </View>

      {/* 칩 선택 */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        {CANDIDATES.map(renderChip)}
      </View>

      {/* 직접 입력 3칸 */}
      <View>
        <TextInput
          value={custom1}
          onChangeText={setCustom1}
          placeholder="직접 입력 1"
          returnKeyType="next"
          style={{ borderWidth: 1, borderColor: UI.border, borderRadius: 12, padding: 12, marginBottom: 8 }}
        />
        <TextInput
          value={custom2}
          onChangeText={setCustom2}
          placeholder="직접 입력 2"
          returnKeyType="next"
          style={{ borderWidth: 1, borderColor: UI.border, borderRadius: 12, padding: 12, marginBottom: 8 }}
        />
        <TextInput
          value={custom3}
          onChangeText={setCustom3}
          placeholder="직접 입력 3"
          returnKeyType="done"
          style={{ borderWidth: 1, borderColor: UI.border, borderRadius: 12, padding: 12 }}
        />
      </View>
    </View>
  );

  /** STEP 2 화면 */
  const renderStep2 = () => (
    <View style={{ flex: 1, padding: 20, backgroundColor: UI.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 16, color: UI.sub, marginBottom: 8 }}>한 줄 확언</Text>
      <Text style={{ fontSize: 22, lineHeight: 30, fontWeight: "900", color: UI.text, textAlign: "center" }}>
        {affirmation}
      </Text>
      <Text style={{ color: UI.sub, marginTop: 14 }}>작아도 좋아요. 방금의 사소한 행동도 강점이에요.</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: UI.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1 }}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </View>

      {/* 하단 메인 액션 */}
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
