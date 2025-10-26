// components/routines/HandPalmMassageCard.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image, Animated, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

type Props = {
  onDone: () => void;
  guided?: boolean;
  title?: string;
  subtitle?: string;
  durationSec?: number;
  image?: any;
  instruction?: string;
};

const UI = {
  bg: "#F6F7FA",
  card: "#FFFFFF",
  text: "#0F172A",
  sub: "#6B7280",
  primary: "#0E2A47",
  border: "#E8EDF4",
  track: "#E9EEF6",
};

export default function HandPalmMassageCard({
  onDone,
  guided = false,
  title = "손 마사지(손가락·손바닥)",
  subtitle = "손바닥 마사지",
  durationSec = 90,
  image = require("@/assets/placeholder/hand_palm.png"),
  instruction = "오른손과 손가락으로 왼손 손가락, 손바닥을 부드럽게 마사지합니다.",
}: Props) {
  const { height } = useWindowDimensions();
  // 화면 높이에 비례해 이미지 높이 조절 (작은 폰 220, 큰 폰 최대 360)
  const imageH = Math.min(360, Math.max(220, Math.floor(height * 0.34)));
  const showExtra = height > 740; // 공간 넉넉할 때만 보조문구 추가

  const [left, setLeft] = useState(durationSec);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mmss = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss.toString().padStart(2, "0")}`;
  };

  const clearAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const speak = (t?: string) => {
    if (!guided || !t) return;
    Speech.stop();
    Speech.speak(t, { language: "ko-KR", rate: 1.0, pitch: 1.0 });
  };

  const animateToEnd = (durMs: number) => {
    Animated.timing(progress, { toValue: 1, duration: durMs, useNativeDriver: false }).start(
      ({ finished: fin }) => fin && setFinished(true)
    );
  };

  useEffect(() => {
    speak("손바닥 마사지를 시작합니다. 힘은 약하게, 통증 전까지만.");
    Haptics.selectionAsync();

    progress.setValue(0);
    animateToEnd(durationSec * 1000);

    intervalRef.current = setInterval(() => {
      setLeft((s) => {
        if (paused) return s;
        if (s <= 1) {
          clearAll();
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearAll();
      Speech.stop();
      progress.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    progress.stopAnimation((v) => {
      if (paused) return;
      animateToEnd(left * 1000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const togglePause = () => {
    setPaused((p) => !p);
    Haptics.selectionAsync();
  };

  const restart = () => {
    Speech.stop();
    clearAll();
    setFinished(false);
    setPaused(false);
    setLeft(durationSec);
    progress.setValue(0);
    animateToEnd(durationSec * 1000);
    intervalRef.current = setInterval(() => {
      setLeft((s) => {
        if (paused) return s;
        if (s <= 1) {
          clearAll();
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    Haptics.selectionAsync();
  };

  const widthAnim = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg }}>
      <View style={{ flex: 1, padding: 16, gap: 16 , marginTop: 30}}>
        {/* 카드 */}
        <View
          style={{
            flexGrow: 1,
            borderRadius: 18,
            backgroundColor: UI.card,
            borderWidth: 1,
            borderColor: UI.border,
            padding: 16,
            shadowColor: "rgba(15,23,42,0.08)",
            shadowOpacity: 1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          {/* 헤더 */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View style={{ flexShrink: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: UI.text }}>{title}</Text>
              <Text style={{ marginTop: 2, fontSize: 13, color: UI.sub }}>{subtitle}</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "900", color: UI.primary }}>{mmss(left)}</Text>
          </View>

          {/* 이미지: 높이 가변 */}
          <View
            style={{
              marginTop: 14,
              borderRadius: 14,
              overflow: "hidden",
              backgroundColor: "#F3F6FB",
              width: "100%",
              height: imageH, // ← 화면 기반 확장
            }}
          >
            <Image source={image} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
          </View>

          {/* 설명 */}
          <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 22, color: UI.text }}>
            {instruction}
          </Text>

          {/* 진행바 */}
          {!finished && (
            <View style={{ marginTop: 14, height: 8, borderRadius: 6, backgroundColor: UI.track, overflow: "hidden" }}>
              <Animated.View style={{ width: widthAnim, height: "100%", backgroundColor: UI.primary }} />
            </View>
          )}

          {/* 안전문구 + 추가보조문구(여백 있을 때만) */}
          <Text style={{ marginTop: 10, color: UI.sub, fontSize: 12 }}>
            통증·저림이 느껴지면 즉시 중단하세요.
          </Text>
          {showExtra && (
            <Text style={{ marginTop: 6, color: UI.sub, fontSize: 12 }}>
              힘은 ‘약하게~중간’만, 반동 없이 천천히.
            </Text>
          )}
        </View>

        {/* 바텀 버튼: 공간 남으면 살짝 키움 */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {!finished ? (
            <>
              <TouchableOpacity
                onPress={togglePause}
                style={{
                  flex: 1,
                  height: showExtra ? 52 : 48,
                  borderRadius: 12,
                  backgroundColor: "#F3F6FB",
                  borderWidth: 1,
                  borderColor: UI.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "800" }}>{paused ? "재개" : "일시정지"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={restart}
                style={{
                  flex: 1,
                  height: showExtra ? 52 : 48,
                  borderRadius: 12,
                  backgroundColor: "#F3F6FB",
                  borderWidth: 1,
                  borderColor: UI.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: UI.text, fontWeight: "800" }}>처음부터</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDone}
                style={{
                  flex: 1,
                  height: showExtra ? 52 : 48,
                  borderRadius: 12,
                  backgroundColor: UI.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>종료</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={onDone}
              style={{
                flex: 1,
                height: showExtra ? 56 : 52,
                borderRadius: 14,
                backgroundColor: UI.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>완료</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
