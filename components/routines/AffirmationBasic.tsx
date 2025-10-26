// components/routines/AffirmationBasic.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, Easing, PanResponder, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import RoutineControls from "@/components/routines/common/RoutineControls";

type Props = { guided?: boolean; onDone: () => void; onSkip?: () => void };
type Phase = "inhale" | "hold" | "exhale";
type StepKey = 0 | 1 | 2 | 3;

const MICRO = [
  "오늘의 나, 충분해",
  "나는 해낼 수 있어",
  "나는 소중한 사람",
  "나는 내 편이야",
  "오늘 한 걸음이면 돼",
  "실수해도 괜찮아",
  "나는 점점 나아져",
  "내 선택을 믿어",
  "지금 숨에 집중",
  "몸과 마음 편안해",
  "나는 안전해",

  "천천히 해도 돼",
  "멈춤도 성장이다",
  "쉬어갈 권리 있어",
  "작아도 의미 있어",
  "비교 대신 관찰",
  "오늘도 배운다",
  "나에게 다정하게",
  "지금 이대로 좋아",
  "나는 균형을 찾는다",
];

const UI = {
  bg: "#F7F8FF",
  text: "#0F172A",
  sub: "#6B7280",
  focus: "#15233B",
  border: "#E6EAF2",
  blue1: "#9EC5FF",
  blue2: "#5A86FF",
  blueTrack: "#E6EDFF",
};

const STEP_META: Record<StepKey, { label: string; sub: string; sec: number; aff?: string }> = {
  0: { label: "한 번 깊게 숨", sub: "호흡 정렬 · 4-4", sec: 10 },
  1: { label: "나는 해낼 수 있어", sub: "텍스트 주시 · 들4-멈1-날4", sec: 20, aff: "나는 해낼 수 있어" },
  2: { label: "나는 충분히 가치 있어", sub: "자기수용 · 들4-멈1-날4", sec: 20, aff: "나는 충분히 가치 있어" },
  3: { label: "오늘 한 걸음", sub: "실행의지 · 4박 내쉬기", sec: 10, aff: "오늘 한 걸음이면 돼" },
};

const TOTAL_SEC = 60;
const HOLD2_PAUSE_MS = 2000;
const AUTO_ADVANCE = true;

export default function AffirmationBasic({ guided = false, onDone, onSkip }: Props) {
  const [step, setStep] = useState<StepKey>(0);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(STEP_META[0].sec);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseLeft, setPhaseLeft] = useState<number>(4);

  const scale = useRef(new Animated.Value(0.96)).current;

  const [idx, setIdx] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: Animated.event([null, { dx: x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) setIdx((i) => (i + 1) % MICRO.length);
        else if (g.dx > 80) setIdx((i) => (i - 1 + MICRO.length) % MICRO.length);
        Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const pattern = useMemo<{ p: Phase; s: number }[]>(() => {
    if (step === 0) return [{ p: "inhale" as const, s: 4 }, { p: "exhale" as const, s: 4 }];
    if (step === 1 || step === 2) return [{ p: "inhale" as const, s: 4 }, { p: "hold" as const, s: 1 }, { p: "exhale" as const, s: 4 }];
    return [{ p: "inhale" as const, s: 2 }, { p: "exhale" as const, s: 4 }];
  }, [step]);

  const ringAnim = (p: Phase, dur: number) => {
    const toScale = p === "inhale" ? 1.04 : p === "hold" ? 1.06 : 0.94;
    Animated.timing(scale, {
      toValue: toScale,
      duration: Math.max(1, dur) * 1000,
      easing: p === "exhale" ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const speak = (text: string) => {
    if (!guided) return;
    try { Speech.stop(); Speech.speak(text, { language: "ko-KR", rate: 1.0, pitch: 1.0 }); } catch {}
  };

  const enterStep = async (k: StepKey) => {
    await Haptics.selectionAsync();
    setStep(k);
    setRemaining(STEP_META[k].sec);
    setPhase(pattern[0].p);
    setPhaseLeft(pattern[0].s);
    ringAnim(pattern[0].p, pattern[0].s);

    // 🔧 스텝 기본 문구를 인덱스로만 세팅(표시는 항상 MICRO[idx])
    const def = STEP_META[k].aff;
    if (def) {
      const i = MICRO.indexOf(def);
      if (i >= 0) setIdx(i);
      if (guided) speak(def);
    }
  };

  const transitionToNext = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaused(true);
    setTimeout(() => {
      setPaused(false);
      if (step >= 3) { Haptics.selectionAsync(); onDone(); }
      else { enterStep((step + 1) as StepKey); }
    }, HOLD2_PAUSE_MS);
  };

  // 타이머
  useEffect(() => {
    let t: number | null = null;
    if (!paused) {
      t = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { if (t !== null) clearInterval(t); transitionToNext(); return 0; }
          return r - 1;
        });
        setPhaseLeft((left) => {
            if (left <= 1) {
            setPhase((prev) => {
                const i = pattern.findIndex((it) => it.p === prev);
                const nxt = pattern[(i + 1) % pattern.length];
                ringAnim(nxt.p, nxt.s);
                setPhaseLeft(nxt.s);

                if (AUTO_ADVANCE && prev === "exhale" && nxt.p === "inhale") {
                setIdx((cur) => {
                    const ni = (cur + 1) % MICRO.length;
                    if (guided) speak(MICRO[ni]);
                    return ni;
                });
                }
                return nxt.p;
            });
            return left; // 유지
            }
            return left - 1;
        });
        }, 1000) as unknown as number;
    }
    return () => { if (t !== null) clearInterval(t); };
  }, [paused, step, pattern]);

  useEffect(() => {
    enterStep(0 as StepKey);
    return () => { try { Speech.stop(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 표시/읽기 문구는 항상 MICRO[idx]
  const currentAffirm = MICRO[idx];
  const safeExit = () => { try { Haptics.selectionAsync(); } catch {} ; onSkip ? onSkip() : onDone(); };

  // 진행아크/타이머
  const elapsed = Math.max(
    0,
    Math.min(
      TOTAL_SEC,
      TOTAL_SEC - ([0, 1, 2, 3].slice(step + 1).reduce((a, k) => a + STEP_META[k as StepKey].sec, 0) + remaining)
    )
  );
  const progress = elapsed / TOTAL_SEC;
  const totalRemainingSec = Math.max(0, TOTAL_SEC - Math.round(elapsed));

  const size = 260;
  const strokeW = 12;
  const r = (size - strokeW) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c - c * progress;

  const mm = Math.floor(totalRemainingSec / 60);
  const ss = String(totalRemainingSec % 60).padStart(2, "0");

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={safeExit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>&larr;</Text>
        </TouchableOpacity>
        <Text style={styles.timerLabel}>{mm}:{ss}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 가운데 영역 */}
      <View style={styles.content}>
        {/* 원형 + 텍스트 */}
        <View style={[styles.centerWrap, { width: size, height: size }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Svg width={size} height={size}>
              <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={UI.blue1} />
                  <Stop offset="100%" stopColor={UI.blue2} />
                </LinearGradient>
              </Defs>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={UI.blueTrack} strokeWidth={strokeW} fill="none" />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="url(#grad)"
                strokeWidth={strokeW}
                fill="none"
                strokeDasharray={`${c} ${c}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
          </Animated.View>

          <Animated.View
            {...pan.panHandlers}
            style={[styles.centerTextWrap, { width: size, transform: [{ translateX: x }] }]}
          >
            <Text style={styles.centerText}>{currentAffirm}</Text>
          </Animated.View>
        </View>

        {/* 미니 컨트롤 */}
        <View style={styles.miniControls}>
          <TouchableOpacity
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setIdx((i) => (i - 1 + MICRO.length) % MICRO.length);
              speak(MICRO[(idx - 1 + MICRO.length) % MICRO.length]);
            }}
            style={styles.iconBtn}
          >
            <Text style={styles.icon}>&lsaquo;</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { try { Haptics.selectionAsync(); } catch {} ; speak(currentAffirm); }}
            style={styles.micBtn}
          >
            <Text style={styles.micIcon}>🎤</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setIdx((i) => (i + 1) % MICRO.length);
              speak(MICRO[(idx + 1) % MICRO.length]);
            }}
            style={styles.iconBtn}
          >
            <Text style={styles.icon}>&rsaquo;</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.readHint}>따라 읽기</Text>

        {/* 진행률 바 */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>진행률 {Math.round(progress * 100)}%</Text>
      </View>

      {/* 하단 고정 */}
      <RoutineControls
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        onSkip={() => { void transitionToNext(); }}
        onExit={safeExit}
        hint="호흡 리듬에 맞춰 문구를 천천히 따라 읽어보세요"
        remainingSec={remaining}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,  backgroundColor: UI.bg },
  header: {
    paddingHorizontal: 16, paddingTop: 8,marginTop: 20 , paddingBottom: 6,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  back: { fontSize: 20, color: UI.sub, width: 24, textAlign: "left" },
  timerLabel: { fontSize: 16, fontWeight: "800", color: UI.focus },

  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },

  centerWrap: { alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 12 },
  centerTextWrap: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 24, alignSelf: "center",
  },
  centerText: { textAlign: "center", fontSize: 20, fontWeight: "900", lineHeight: 28, color: UI.focus, maxWidth: 200 },

  miniControls: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 24, color: UI.focus, fontWeight: "900" },
  micBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#EDF2FF",
    borderWidth: 1, borderColor: UI.border, alignItems: "center", justifyContent: "center",
  },
  micIcon: { fontSize: 20 },
  readHint: { textAlign: "center", color: UI.sub, marginTop: 8 },

  progressBar: { height: 8, borderRadius: 8, backgroundColor: UI.blueTrack, marginHorizontal: 24, marginTop: 10, overflow: "hidden", width: "100%" },
  progressFill: { height: "100%", backgroundColor: UI.blue2 },
  progressLabel: { textAlign: "center", color: UI.sub, marginTop: 6 },
});
