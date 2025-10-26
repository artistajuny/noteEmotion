// components/routines/Move1MinRoutine.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import * as Haptics from "expo-haptics";

type TimerID = ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;

const UI = {
  bg: "#FFFFFF",
  text: "#0F172A",
  sub: "#6B7280",
  primary: "#0E2A47",
  border: "#EEF2F7",
  card: "#FFFFFF",
};

export default function Move1MinRoutine({ onDone }: { onDone: () => void }) {
  const DURATION = 60;

  const [sec, setSec] = useState(DURATION);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);

  // 애니메이션
  const scale = useRef(new Animated.Value(1)).current;

  // 타이머 관리(일시정지/스킵/종료 시 일괄 정리)
  const timersRef = useRef<TimerID[]>([]);
  const track = (t: TimerID) => (timersRef.current.push(t), t);
  const clearAll = () => {
    timersRef.current.forEach((t) => {
      clearInterval(t as any);
      clearTimeout(t as any);
    });
    timersRef.current = [];
  };

  const startAnim = () => {
    scale.stopAnimation();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  };

  const finish = async () => {
    clearAll();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFinished(true);
  };

  const restart = async () => {
    clearAll();
    await Haptics.selectionAsync();
    setFinished(false);
    setPaused(false);
    setSec(DURATION);
    startAnim();
    startTimer();
  };

  const togglePause = () => setPaused((p) => !p);

  const skip = () => {
    clearAll();
    setSec(0);
    finish();
  };

  const exit = () => {
    clearAll();
    onDone();
  };

  const startTimer = () => {
    const timer = track(
      setInterval(() => {
        setSec((s) => {
          if (paused) return s;
          if (s <= 1) {
            clearAll();
            setTimeout(() => finish(), 10);
            return 0;
          }
          return s - 1;
        });
      }, 1000)
    );
    return timer;
  };

  useEffect(() => {
    startAnim();
    startTimer();
    return () => clearAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: UI.bg, justifyContent: "center", alignItems: "center" }}>
      {/* 본문 */}
      {!finished ? (
        <>
          <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
            <Text style={{ fontSize: 56, fontWeight: "900", color: UI.text }}>{sec}</Text>
          </Animated.View>
          <Text style={{ marginTop: 16, color: UI.sub, fontSize: 16, textAlign: "center", paddingHorizontal: 20 }}>
            제자리에서 가볍게 팔을 흔들고 몸을 풀어보세요{"\n"}호흡을 자연스럽게 유지하며 움직입니다.
          </Text>
        </>
      ) : (
        // 완료 화면 (공통 UX)
        <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 12, color: UI.text }}>1분 완료!</Text>
          <View style={{ flexDirection: "row", gap: 10, width: "100%", paddingHorizontal: 20 }}>
            <TouchableOpacity
              onPress={restart}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: UI.border,
                borderRadius: 12,
                backgroundColor: "#F6F8FB",
                alignItems: "center",
              }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>다시 하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDone}
              style={{
                flex: 1,
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

      {/* 하단 컨트롤(일시정지 · 건너뛰기 · 종료) */}
      {!finished && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20,
            borderTopWidth: 1,
            borderTopColor: UI.border,
            backgroundColor: UI.card,
          }}
        >
          <Text style={{ textAlign: "center", color: UI.sub, marginBottom: 6 }}>
            어지럼·불편함이 있으면 즉시 중단하세요
          </Text>
          <View style={{ flexDirection: "row", gap: 10 ,paddingBottom: 20 }}>
            <TouchableOpacity
              onPress={togglePause}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                alignItems: "center",
                backgroundColor: "#F6F8FB",
              }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>{paused ? "재개" : "일시정지"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={skip}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                alignItems: "center",
                backgroundColor: "#F6F8FB",
              }}
            >
              <Text style={{ color: UI.text, fontWeight: "800" }}>건너뛰기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={exit}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: UI.primary,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>종료</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
