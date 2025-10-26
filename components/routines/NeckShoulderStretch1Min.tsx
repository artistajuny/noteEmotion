// components/routines/NeckShoulderStretch1Min.tsx
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
  ringIn: "#DDF0FF",
  ringOut: "#EFF6FF",
};

type PhaseKey = "neckLeft" | "neckRight" | "rollBack" | "rollFront" | "chinTuck" | "crossBody";

type Phase = {
  key: PhaseKey;
  label: string;
  hint: string;
  sec: number;
  speak?: string;
};

const PHASES: Phase[] = [
  { key: "neckLeft",  label: "목 기울이기 (좌)", hint: "왼쪽 어깨로 귀를 기울여 10초", sec: 10, speak: "왼쪽으로 고개를 기울여요. 어깨는 내리고, 통증 전까지만." },
  { key: "neckRight", label: "목 기울이기 (우)", hint: "오른쪽 어깨로 귀를 기울여 10초", sec: 10, speak: "오른쪽으로 고개를 기울여요. 호흡은 편안하게." },
  { key: "rollBack",  label: "어깨 돌리기 (뒤)",  hint: "어깨를 뒤로 크게 10초",       sec: 10, speak: "어깨를 뒤로 크게 원을 그리며 10초." },
  { key: "rollFront", label: "어깨 돌리기 (앞)",  hint: "어깨를 앞으로 크게 10초",     sec: 10, speak: "이번엔 앞으로 크게 10초." },
  { key: "chinTuck",  label: "턱 당기기",        hint: "턱을 살짝 당겨 10초",         sec: 10, speak: "정면을 보며 턱을 살짝 당겨 목 뒤를 길게 합니다." },
  { key: "crossBody", label: "크로스 바디",      hint: "팔을 가슴 앞으로 가볍게 10초", sec: 10, speak: "한 팔을 가슴 앞으로 가져와 반대팔로 부드럽게 당겨요." },
];

type TimerID = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

export default function NeckShoulderStretch1Min({ onDone, guided }: Props) {
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(PHASES[0].sec);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  // anim values
  const scale = useRef(new Animated.Value(1)).current;
  const tilt = useRef(new Animated.Value(0)).current;     // -1..1
  const rotate = useRef(new Animated.Value(0)).current;   // 0..1
  const opacity = useRef(new Animated.Value(1)).current;

  const timers = useRef<TimerID[]>([]);
  const track = (t: TimerID) => { timers.current.push(t); return t; };
  const clearAll = () => {
    timers.current.forEach((t) => { clearInterval(t as any); clearTimeout(t as any); });
    timers.current = [];
  };

  const speak = (text?: string) => {
    if (!guided || !text) return;
    Speech.stop();
    Speech.speak(text, { language: "ko-KR", pitch: 1.0, rate: 1.0 });
  };

  const phase = PHASES[idx];

  // 회전 복귀(루프 멈춘 각도→가까운 정수→0)
  const smoothResetRotate = () => {
    rotate.stopAnimation((val?: number) => {
      const v = typeof val === "number" ? val : 0;
      const to = v > 0.5 ? 1 : 0;
      Animated.timing(rotate, { toValue: to, duration: 180, useNativeDriver: true })
        .start(() => rotate.setValue(0));
    });
  };

  const runAnim = (p: Phase) => {
    scale.stopAnimation(); tilt.stopAnimation(); opacity.stopAnimation();

    Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]).start();

    if (p.key === "neckLeft" || p.key === "neckRight") {
      smoothResetRotate();
      const to = p.key === "neckLeft" ? -1 : 1;
      Animated.timing(tilt, { toValue: to, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (p.key === "rollBack" || p.key === "rollFront") {
      tilt.setValue(0);
      rotate.setValue(0);
      Animated.loop(
        Animated.timing(rotate, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
      ).start();
    } else if (p.key === "chinTuck") {
      smoothResetRotate();
      tilt.setValue(0);
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.94, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ]).start();
    } else if (p.key === "crossBody") {
      smoothResetRotate();
      tilt.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.92, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  };

  const startCountdown = () => {
    setLeft(phase.sec);
    const itv = track(setInterval(() => {
      setLeft((s) => {
        if (paused) return s;
        if (s <= 1) { clearInterval(itv as any); next(); return 0; }
        return s - 1;
      });
    }, 1000));
  };

  const next = () => {
    if (phase.key === "rollBack" || phase.key === "rollFront") smoothResetRotate();
    opacity.setValue(1);

    if (idx < PHASES.length - 1) setIdx((i) => i + 1);
    else { setFinished(true); Speech.stop(); }
  };

  const togglePause = () => setPaused((p) => !p);
  const skip = () => { clearAll(); next(); };
  const restart = () => {
    Speech.stop(); clearAll();
    setPaused(false); setFinished(false);
    setIdx(0); setLeft(PHASES[0].sec);
    scale.setValue(1); tilt.setValue(0); opacity.setValue(1);
    smoothResetRotate();
  };

  useEffect(() => {
    clearAll();
    Haptics.selectionAsync();
    if (phase.key !== "rollBack" && phase.key !== "rollFront") smoothResetRotate();
    speak(phase.speak);
    runAnim(phase);
    startCountdown();

    return () => {
      clearAll();
      scale.stopAnimation(); tilt.stopAnimation(); rotate.stopAnimation(); opacity.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const PhaseDots = useMemo(() => () => (
    <View style={{ flexDirection: "row", gap: 8, alignSelf: "center", marginTop: 8 }}>
      {PHASES.map((_, i) => (
        <View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: i <= idx ? UI.primary : "#C9D2E3",
            opacity: i === idx ? 1 : 0.6,
          }}
        />
      ))}
    </View>
  ), [idx]);

  const tiltDeg = tilt.interpolate({ inputRange: [-1, 1], outputRange: ["-10deg", "10deg"] });
  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 35, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: UI.text, textAlign: "center" }}>
          1분 스트레칭 · 목·어깨
        </Text>
        <Text style={{ marginTop: 6, color: UI.sub, textAlign: "center" }}>
          {PHASES[idx].label} · {PHASES.length - idx - 1} 단계 남음
        </Text>
        <PhaseDots />
      </View>

      {/* 본문 */}
      {!finished ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={{
              width: 240, height: 240, borderRadius: 120,
              alignItems: "center", justifyContent: "center",
              backgroundColor: phase.key === "rollBack" || phase.key === "rollFront" ? UI.ringOut : UI.ringIn,
              borderWidth: 1, borderColor: UI.border,
              transform: [{ scale }, { rotate: rotateDeg }, { rotateZ: tiltDeg }],
              opacity,
              shadowColor: "rgba(15,23,42,0.16)", shadowOpacity: 1, shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 }, elevation: 10,
            }}
          >
            <Text style={{ fontSize: 14, color: UI.text, marginBottom: 4, fontWeight: "700" }}>
              {phase.label}
            </Text>
            <Text style={{ fontSize: 54, fontWeight: "900", color: UI.text }}>
              {left}
            </Text>
          </Animated.View>

          <View style={{ marginTop: 16, alignItems: "center", paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 16, color: UI.text, fontWeight: "800", textAlign: "center" }}>
              {phase.hint}
            </Text>
            <View style={{ height: 6 }} />
            <Text style={{ fontSize: 13, color: UI.sub, textAlign: "center" }}>
              통증 전까지만, 반동 없이 부드럽게
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: UI.text, marginBottom: 16 }}>
            잘했어요! 목·어깨가 한결 가벼워졌나요?
          </Text>
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
        </View>
      )}

      {/* 하단 컨트롤 */}
      {!finished && (
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: UI.border, backgroundColor: "#fff" }}>
          <Text style={{ textAlign: "center", color: UI.sub }}>통증·어지럼이 느껴지면 즉시 중단하세요</Text>
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setPaused((p) => !p)}
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
