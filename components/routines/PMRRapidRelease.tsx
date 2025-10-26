// components/routines/PMRRapidRelease.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

type Props = { onDone: () => void; guided?: boolean };

const UI = {
  bg: "#FAFAFC",
  text: "#0F172A",
  sub: "#6B7280",
  primary: "#0E2A47",
  border: "#EEF2F7",
  ringIn: "#CFE4FF",
  ringOut: "#E3EBFF",
};

type PhaseKey = "inhale" | "hold" | "exhale" | "scan";
type Phase = { key: PhaseKey; label: string; sec: number; speak?: string };
type Cycle = Phase[];

/** 단일 루틴: 1사이클 = (들이마시기 4) → (긴장 유지 5) → (내쉬며 이완 8) → (감각 머무르기 5) */
const CYCLE: Cycle = [
  { key: "inhale", label: "들이마시기", sec: 4, speak: "천천히 들이마셔요" },
  { key: "hold",   label: "살짝 힘 주기", sec: 5, speak: "손과 어깨에 살짝 힘을 주세요" },
  { key: "exhale", label: "내쉬며 풀기", sec: 8, speak: "후 하고 길게 내쉬며 힘을 풀어요" },
  { key: "scan",   label: "감각 머무르기", sec: 5, speak: "편안한 감각에 머뭅니다" },
];

// 총 반복 횟수
const CYCLES = 3;

type TimerID = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

export default function PMRRapidRelease({ onDone, guided }: Props) {
  const [cycle, setCycle] = useState(0);       // 0..CYCLES-1
  const [phaseIdx, setPhaseIdx] = useState(0); // 0..CYCLE.length-1
  const [left, setLeft] = useState<number>(CYCLE[0].sec);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);

  // 애니메이션 값
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const timersRef = useRef<TimerID[]>([]);
  const track = (t: TimerID) => (timersRef.current.push(t), t);
  const clearAll = () => {
    timersRef.current.forEach((t) => {
      clearInterval(t as any);
      clearTimeout(t as any);
    });
    timersRef.current = [];
  };

  const speak = (text?: string) => {
    if (!guided || !text) return;
    Speech.stop();
    Speech.speak(text, { language: "ko-KR", pitch: 1.0, rate: 1.0 });
  };

  const phase = CYCLE[phaseIdx];

  /** 페이즈별 애니메이션 */
  const runAnim = (p: Phase) => {
    scale.stopAnimation(); opacity.stopAnimation();
    if (p.key === "inhale") {
      Animated.timing(scale, {
        toValue: 1.12, duration: p.sec * 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true,
      }).start();
    } else if (p.key === "hold") {
      Animated.timing(scale, { toValue: 0.92, duration: p.sec * 1000, useNativeDriver: true }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (p.key === "exhale") {
      Animated.timing(scale, {
        toValue: 0.85, duration: p.sec * 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    } else if (p.key === "scan") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.92, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }
  };

  /** 타이머 시작 */
  const startCountdown = () => {
    setLeft(phase.sec);
    const itv = track(
      setInterval(() => {
        setLeft((s) => {
          if (paused) return s;
          if (s <= 1) {
            clearInterval(itv as any);
            nextPhase();
            return 0;
          }
          return s - 1;
        });
      }, 1000)
    );
  };

  /** 다음 페이즈/사이클 이동 */
  const nextPhase = () => {
    opacity.setValue(1);
    if (phaseIdx < CYCLE.length - 1) {
      setPhaseIdx((i) => i + 1);
    } else {
      if (cycle < CYCLES - 1) {
        setCycle((c) => c + 1);
        setPhaseIdx(0);
      } else {
        setFinished(true);
        Speech.stop();
      }
    }
  };

  /** 건너뛰기 */
  const skip = () => {
    clearAll();
    nextPhase();
  };

  /** 일시정지/재개 */
  const togglePause = () => setPaused((p) => !p);

  /** 재시작 */
  const restart = () => {
    Speech.stop();
    clearAll();
    setFinished(false);
    setPaused(false);
    setCycle(0);
    setPhaseIdx(0);
    setLeft(CYCLE[0].sec);
    scale.setValue(1);
    opacity.setValue(1);
  };

  // 페이즈 진입
  useEffect(() => {
    clearAll();
    Haptics.selectionAsync();
    speak(phase.speak);
    runAnim(phase);
    startCountdown();

    return () => {
      clearAll();
      scale.stopAnimation();
      opacity.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx, cycle]);

  const CycleDots = useMemo(
    () => () => (
      <View style={{ flexDirection: "row", gap: 8, alignSelf: "center", marginTop: 8 }}>
        {Array.from({ length: CYCLES }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: i <= cycle ? UI.primary : "#C9D2E3",
              opacity: i === cycle ? 1 : 0.6,
            }}
          />
        ))}
      </View>
    ),
    [cycle]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 35, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: UI.text, textAlign: "center" }}>
          전신 이완 루틴
        </Text>
        <Text style={{ marginTop: 6, color: UI.sub, textAlign: "center" }}>
          {phase.label} · {CYCLES - cycle - 1} 사이클 남음
        </Text>
        <CycleDots />
      </View>

      {/* 본문 */}
      {!finished ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={{
              width: 260, height: 260, borderRadius: 130,
              transform: [{ scale }], opacity,
              backgroundColor: phase.key === "exhale" || phase.key === "hold" ? UI.ringOut : UI.ringIn,
              borderWidth: 1, borderColor: UI.border,
              alignItems: "center", justifyContent: "center",
              shadowColor: "rgba(15,23,42,0.18)", shadowOpacity: 1, shadowRadius: 22,
              shadowOffset: { width: 0, height: 10 }, elevation: 12,
            }}
          >
            <Text style={{ fontSize: 15, color: UI.text, marginBottom: 6, fontWeight: "700" }}>
              {phase.label}
            </Text>
            <Text style={{ fontSize: 56, fontWeight: "900", color: UI.text, letterSpacing: 1 }}>
              {left}
            </Text>
          </Animated.View>

          {/* 현재/다음 안내 */}
          <View style={{ marginTop: 18, alignItems: "center", paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 16, color: UI.text, fontWeight: "800" }}>
              {phase.label}
            </Text>
            <View style={{ height: 6 }} />
            <Text style={{ fontSize: 14, color: UI.sub }}>
              다음: {CYCLE[(phaseIdx + 1) % CYCLE.length].label}
            </Text>
          </View>
        </View>
      ) : (
        // 완료 화면
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: UI.text, marginBottom: 16 }}>이완 완료!</Text>
          <View style={{ width: "100%", gap: 10 }}>
            <TouchableOpacity
              onPress={restart}
              style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: UI.border, backgroundColor: "#F6F8FB", alignItems: "center" }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>다시 하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDone}
              style={{ paddingVertical: 14, borderRadius: 12, backgroundColor: UI.primary, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>완료</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ marginTop: 14, color: UI.sub, fontSize: 12 }}>
            긴장도 -2 ~ -3 / 호흡 편안함 +2 ~ +3 기대
          </Text>
        </View>
      )}

      {/* 하단 컨트롤 */}
      {!finished && (
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: UI.border, backgroundColor: "#fff" }}>
          <Text style={{ textAlign: "center", color: UI.sub }}>어지럼·불편함이 있으면 즉시 중단하세요</Text>
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={togglePause}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: UI.border, alignItems: "center", backgroundColor: "#F6F8FB" }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>{paused ? "재개" : "일시정지"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={skip}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: UI.border, alignItems: "center", backgroundColor: "#F6F8FB" }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>건너뛰기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Speech.stop(); onDone(); }}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: UI.primary }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>종료</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
