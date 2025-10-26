// components/routines/BodyScanRoutine.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import RoutineControls from "@/components/routines/common/RoutineControls";

type Step = { label: string; hint: string; duration: number };
const STEPS: Step[] = [
  { label: "머리·얼굴", hint: "이마와 눈, 턱의 긴장을 느껴보세요.", duration: 20 },
  { label: "어깨", hint: "어깨의 무게를 알아차리고 힘을 풀어보세요.", duration: 20 },
  { label: "가슴·팔", hint: "가슴과 팔의 감각에 주의를 기울여 보세요.", duration: 20 },
  { label: "복부", hint: "호흡이 배로 드나드는 걸 느껴보세요.", duration: 20 },
  { label: "다리", hint: "허벅지부터 발끝까지 감각을 느껴보세요.", duration: 20 },
  { label: "전체", hint: "몸 전체가 이완되는 느낌을 경험하세요.", duration: 20 },
];

// 🎨 공통 톤
const UI = {
  bg: "#FFFFFF",
  text: "#0F172A",
  sub: "#6B7280",
  primary: "#0E2A47",
  border: "#EEF2F7",
  card: "#FFFFFF",
  dotOff: "#C9D2E3",
};

type TimerID = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

export default function BodyScanRoutine({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(STEPS[0].duration);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);

  const fade = useRef(new Animated.Value(1)).current;

  // 타이머 관리 (일시정지/스킵/종료 시 일괄 정리)
  const timersRef = useRef<TimerID[]>([]);
  const track = (t: TimerID) => (timersRef.current.push(t), t);
  const clearAll = () => {
    timersRef.current.forEach((t) => {
      clearInterval(t as any);
      clearTimeout(t as any);
    });
    timersRef.current = [];
  };

  const speakStep = (i: number) => {
    Speech.stop();
    Speech.speak(STEPS[i].hint, { language: "ko-KR", pitch: 1.0, rate: 1.0 });
  };

  // 첫 진입
  useEffect(() => {
    speakStep(0);
    return () => {
      Speech.stop();
      clearAll();
    };
  }, []);

  // 단계 변경 타이머(일시정지 반영)
  useEffect(() => {
    if (finished) return;
    clearAll();
    const timer = track(
      setInterval(() => {
        setLeft((sec) => {
          if (paused) return sec;
          if (sec <= 1) {
            clearAll();
            setTimeout(() => nextStep(), 10);
            return 0;
          }
          return sec - 1;
        });
      }, 1000)
    );
    return () => clearAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished, paused]);

  const nextStep = async () => {
    await Haptics.selectionAsync();
    if (idx >= STEPS.length - 1) {
      Speech.stop();
      setFinished(true);
      return;
    }
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const nxt = idx + 1;
    setIdx(nxt);
    setLeft(STEPS[nxt].duration);
    speakStep(nxt);
  };

  const restart = async () => {
    await Haptics.selectionAsync();
    Speech.stop();
    clearAll();
    setFinished(false);
    setPaused(false);
    setIdx(0);
    setLeft(STEPS[0].duration);
    speakStep(0);
  };

  // ⏸ 일시정지/재개
  const togglePause = () => setPaused((p) => !p);

  // ⏭ 건너뛰기(다음 스텝으로 즉시)
  const skip = () => {
    clearAll();
    nextStep();
  };

  // ⏹ 종료
  const exit = () => {
    Speech.stop();
    clearAll();
    onDone();
  };

  return (
    <View style={{ flex: 1, backgroundColor: UI.bg, padding: 20 }}>
      {/* 진행 점 */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8, marginBottom: 16 }}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              marginHorizontal: 4,
              backgroundColor: i <= idx ? UI.primary : UI.dotOff,
              opacity: i === idx ? 1 : 0.6,
            }}
          />
        ))}
      </View>

      {/* 본문 */}
      {!finished ? (
        <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: fade }}>
          <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 12, color: UI.text }}>
            {STEPS[idx].label}
          </Text>
          <Text style={{ fontSize: 16, color: UI.sub, textAlign: "center" }}>
            {STEPS[idx].hint}
          </Text>
          <Text style={{ fontSize: 40, fontWeight: "900", marginTop: 20, color: UI.text }}>{left}</Text>
        </Animated.View>
      ) : (
        // 완료 화면 (공통 UX)
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: UI.text, marginBottom: 16 }}>
            바디스캔 완료!
          </Text>
          <View style={{ width: "100%", gap: 10 }}>
            <TouchableOpacity
              onPress={restart}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                backgroundColor: "#F6F8FB",
                alignItems: "center",
              }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>다시 하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDone}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: UI.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 하단 컨트롤 (일시정지 · 건너뛰기 · 종료) */}
      {!finished && (
        <RoutineControls
          paused={paused}
          onTogglePause={togglePause}
          onSkip={skip}             // 스텝 건너뛰기(다음)
          onExit={exit}             // 루틴 종료
          hint="시선을 편안히 두고, 안내 음성에 따라 몸 감각을 느껴보세요"
          remainingSec={left}       // 선택
        />
      )}
    </View>
  );
}
