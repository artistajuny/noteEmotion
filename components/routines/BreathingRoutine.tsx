// components/routines/BreathingRoutine.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import RoutineControls from "@/components/routines/common/RoutineControls";

type Phase = "inhale" | "hold" | "exhale";
type Props = { onDone: () => void; cycles?: number; guided?: boolean };

const PHASE_DUR: Record<Phase, number> = { inhale: 4, hold: 7, exhale: 8 };
const PHASE_LABEL: Record<Phase, string> = {
  inhale: "들이마시기",
  hold: "멈추기",
  exhale: "내쉬기",
};
const PHASE_HINT: Record<Phase, string> = {
  inhale: "코로 들이마시며 배가 부풀도록",
  hold: "가볍게 멈추며 몸의 긴장을 느끼기",
  exhale: "입으로 길게 내쉬며 어깨 힘 빼기",
};

// 🎨 UI
const UI = {
  bg: "#FAFAFC",
  text: "#0F172A",
  sub: "#6B7280",
  primary: "#0E2A47",
  ringInhale: "#CFE4FF",
  ringExhale: "#E3EBFF",
  ringShadow: "rgba(15, 23, 42, 0.18)",
  card: "#FFFFFF",
  border: "#EEF2F7",
  dotOn: "#0E2A47",
  dotOff: "#C9D2E3",
};

type TimerID = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

export default function BreathingRoutine({ onDone, cycles = 3, guided }: Props) {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [left, setLeft] = useState<number>(PHASE_DUR.inhale);
  const [cycle, setCycle] = useState<number>(1);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);

  // 애니메이션
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // 타이머 트래킹
  const timersRef = useRef<TimerID[]>([]);
  const track = (t: TimerID) => (timersRef.current.push(t), t);
  const clearAll = () => {
    timersRef.current.forEach((t) => {
      clearInterval(t as any);
      clearTimeout(t as any);
    });
    timersRef.current = [];
  };

  const startAnim = (p: Phase) => {
    const toScale = p === "inhale" ? 1.1 : p === "hold" ? 1.1 : 0.75;
    const toOpacity = p === "hold" ? 0.98 : 1;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: toScale,
        duration: PHASE_DUR[p] * 1000,
        easing: p === "exhale" ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: toOpacity, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const nextPhase = async () => {
    if (phase === "inhale") {
      setPhase("hold");
      setLeft(PHASE_DUR.hold);
      await Haptics.selectionAsync();
      startAnim("hold");
      return;
    }
    if (phase === "hold") {
      setPhase("exhale");
      setLeft(PHASE_DUR.exhale);
      await Haptics.selectionAsync();
      startAnim("exhale");
      return;
    }
    // exhale -> 다음 사이클
    if (cycle >= cycles) {
      setFinished(true);
      return;
    }
    const nxt = cycle + 1;
    setCycle(nxt);
    setPhase("inhale");
    setLeft(PHASE_DUR.inhale);
    await Haptics.selectionAsync();
    startAnim("inhale");
  };

  const restart = () => {
    clearAll();
    setFinished(false);
    setPaused(false);
    setCycle(1);
    setPhase("inhale");
    setLeft(PHASE_DUR.inhale);
    startAnim("inhale");
  };

  // ⏸ 일시정지/재개
  const togglePause = () => setPaused((p) => !p);

  // ⏭ 건너뛰기(다음 페이즈로 즉시 이동)
  const skip = () => {
    clearAll();
    nextPhase();
  };

  // ⏹ 종료
  const exit = () => {
    clearAll();
    onDone();
  };

  useEffect(() => {
    startAnim("inhale");
    return () => clearAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (finished) return;
    clearAll();
    const t = track(
      setInterval(() => {
        setLeft((sec) => {
          if (paused) return sec;
          if (sec <= 1) {
            clearAll();
            setTimeout(() => nextPhase(), 10);
            return 0;
          }
          return sec - 1;
        });
      }, 1000)
    );
    return () => clearAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cycle, finished, paused]);

  const Dots = () => (
    <View style={{ flexDirection: "row", gap: 8, alignSelf: "center", marginTop: 10 }}>
      {Array.from({ length: cycles }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i < cycle ? UI.dotOn : UI.dotOff,
            opacity: i < cycle ? 1 : 0.6,
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 35, paddingBottom: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: UI.text, textAlign: "center" }}>
          호흡 4 · 7 · 8
        </Text>
        <Text style={{ marginTop: 8, color: UI.sub, textAlign: "center" }}>
          {guided ? "가이드형" : "자유형"} · {cycle} / {cycles} 사이클
        </Text>
        <Dots />
      </View>

      {/* 중앙 원 */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 20 }}>
        <Animated.View
          style={{
            width: 260,
            height: 260,
            borderRadius: 130,
            transform: [{ scale }],
            opacity,
            backgroundColor: phase === "exhale" ? UI.ringExhale : UI.ringInhale,
            shadowColor: UI.ringShadow,
            shadowOpacity: 1,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: UI.border,
          }}
        >
          <Text style={{ fontSize: 15, color: UI.text, marginBottom: 6, fontWeight: "700" }}>
            {PHASE_LABEL[phase]}
          </Text>
          <Text style={{ fontSize: 56, fontWeight: "900", color: UI.text, letterSpacing: 1 }}>
            {left}
          </Text>
        </Animated.View>
      </View>

      {/* 하단 컨트롤 / 완료 화면 */}
      {!finished ? (
        <RoutineControls
          paused={paused}
          onTogglePause={togglePause}
          onSkip={skip}
          onExit={exit}
          hint={guided ? PHASE_HINT[phase] : "시선을 원에 두고 리듬만 따라오세요"}
          remainingSec={left}
        />
      ) : (
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 30,
            backgroundColor: UI.card,
            borderTopWidth: 1,
            borderTopColor: UI.border,
            gap: 12,
          }}
        >
          <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "800", color: UI.text }}>
            {cycles} 사이클 완료!
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                backgroundColor: "#F6F8FB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text onPress={restart} style={{ paddingVertical: 14, color: UI.text, fontWeight: "800" }}>
                다시 하기
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                borderRadius: 12,
                backgroundColor: UI.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text onPress={onDone} style={{ paddingVertical: 14, color: "#fff", fontWeight: "900" }}>
                완료
              </Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
