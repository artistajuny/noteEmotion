// components/routines/DrinkWaterRoutine.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Alert, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type Step = { label: string; hint: string; duration: number };

const UI = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#0F172A",
  sub: "#374151",      // ↑ 가독성 강화(진한 회색)
  subSoft: "#4B5563",  // 보조 문구
  primary: "#111827",
  dotOn: "#111827",
  dotOff: "#D1D5DB",
  shadow: "rgba(15,23,42,0.12)",
};

const SIP_STEPS: Step[] = [
  { label: "1모금", hint: "작게 한 모금 · 천천히 삼킴 · 혀끝은 윗잇몸 뒤 가볍게.", duration: 12 },
  { label: "2모금", hint: "작게 한 모금 · 2초 정지 · 어깨 힘 툭.", duration: 12 },
  { label: "3모금", hint: "작게 한 모금 · 입가 한 번 적시고 호흡 정돈.", duration: 12 },
];

const BREATH_STEP: Step = { label: "호흡 4·2·4", hint: "코 4초 들숨 · 2초 멈춤 · 입 4초 날숨.", duration: 12 };

export default function DrinkWaterRoutine({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"ask" | "water" | "fallback">("ask");
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(0);

  const pulse = useRef(new Animated.Value(1)).current;

  const WATER_STEPS: Step[] = [...SIP_STEPS, BREATH_STEP];
  const FB_STEPS: Step[] = [
    { label: "입술 적시기", hint: "입 다물고 혀로 침을 돌려 입술을 부드럽게 적셔요.", duration: 10 },
    { label: "호흡 4·2·4 ×2", hint: "코 4초 들숨 · 2초 멈춤 · 입 4초 날숨(두 번).", duration: 20 },
    { label: "릴리즈", hint: "어깨 들어올렸다 툭 · 손가락 가볍게 털기.", duration: 15 },
  ];
  const STEPS = mode === "water" ? WATER_STEPS : FB_STEPS;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => { startPulse(); }, []);

  useEffect(() => {
    if (mode === "ask") return;
    setIdx(0);
    setLeft(STEPS[0].duration);
  }, [mode]);

  useEffect(() => {
    if (mode === "ask") return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          next();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [idx, mode]);

  const next = async () => {
    await Haptics.selectionAsync();
    if (idx >= STEPS.length - 1) { onDone(); return; }
    const n = idx + 1;
    setIdx(n);
    setLeft(STEPS[n].duration);
  };

  if (mode === "ask") {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: UI.bg }}>
        <View style={{ flex:1, paddingHorizontal:20, paddingTop:16, justifyContent:"center", gap:18 }}>
          <Text style={{ fontSize:22, fontWeight:"900", color: UI.text, textAlign:"center", letterSpacing:0.2 }}>
            물 한 잔 마시기
          </Text>
          <Text style={{ fontSize:15, lineHeight:22, color: UI.sub, textAlign:"center", marginTop:8 }}>
            지금 곁에 마실 물이 있나요?
          </Text>

          <View style={{ flexDirection:"row", gap:12, marginTop:6 }}>
            <TouchableOpacity
              onPress={() => setMode("water")}
              style={{ flex:1, paddingVertical:16, borderRadius:14, backgroundColor: UI.primary, alignItems:"center" }}
            >
              <Text style={{ color:"#fff", fontWeight:"900", fontSize:15 }}>있어요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("물 없음", "대신 45초 미니 수분 루틴으로 진행할게요.");
                setMode("fallback");
              }}
              style={{
                flex:1, paddingVertical:16, borderRadius:14,
                backgroundColor: UI.card, borderWidth:1, borderColor: UI.border, alignItems:"center"
              }}
            >
              <Text style={{ color: UI.text, fontWeight:"900", fontSize:15 }}>없어요</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize:13, lineHeight:20, color: UI.subSoft, textAlign:"center", marginTop:6 }}>
            팁: ‘있어요’ 선택 시 작게 3모금 + 4·2·4 호흡(약 60초)
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cur = STEPS[idx];

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: UI.bg }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal:20, paddingTop:30, paddingBottom:8 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color: UI.text, textAlign:"center" }}>
          {mode === "water" ? "물 한 잔 마시기 (60초)" : "미니 수분 루틴 (45초)"}
        </Text>
        <Text
          style={{
            fontSize:15, lineHeight:22, color: UI.sub,
            textAlign:"center", marginTop:8, letterSpacing:0.1
          }}
        >
          {mode === "water" ? "작게 3모금 + 4·2·4 호흡" : "물 없이도 즉시: 수분감 · 호흡 · 이완"}
        </Text>

        {/* 진행 점 */}
        <View style={{ flexDirection:"row", justifyContent:"center", gap:8, marginTop:10 }}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                width:8, height:8, borderRadius:4,
                backgroundColor: i <= idx ? UI.dotOn : UI.dotOff,
                opacity: i === idx ? 1 : 0.6
              }}
            />
          ))}
        </View>
      </View>

      {/* 본문 카드 */}
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:20 }}>
        <Animated.View
          style={{
            width: 300, minHeight: 210, borderRadius: 20,
            paddingVertical:20, paddingHorizontal:18,
            backgroundColor: UI.card, borderWidth:1, borderColor: UI.border,
            shadowColor: UI.shadow, shadowOpacity: 1, shadowRadius: 22, shadowOffset: { width:0, height:10 },
            elevation: 6, transform: [{ scale: pulse }], alignItems:"center", justifyContent:"center"
          }}
        >
          <Text style={{ fontSize:16, fontWeight:"900", color: UI.text, letterSpacing:0.2 }}>{cur.label}</Text>
          <Text
            style={{
              fontSize:16, lineHeight:24, color:"#1F2937",
              textAlign:"center", marginTop:10, letterSpacing:0.1, maxWidth:300
            }}
          >
            {cur.hint}
          </Text>
          <Text style={{ fontSize:60, fontWeight:"900", color:"#0B1324", letterSpacing:0.5, marginTop:12 }}>
            {left}
          </Text>
        </Animated.View>
      </View>

      {/* 하단 CTA */}
      <View style={{ padding:20, paddingTop:0 }}>
        <TouchableOpacity
          onPress={next}
          style={{
            height:52, borderRadius:14, alignItems:"center", justifyContent:"center",
            backgroundColor: UI.primary
          }}
        >
          <Text style={{ color:"#fff", fontWeight:"900", fontSize:16 }}>
            {idx >= STEPS.length - 1 ? "완료" : "다음"}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize:13, lineHeight:20, color: UI.subSoft, textAlign:"center", marginTop:10 }}>
          {mode === "water" ? "모금은 작게 · 삼키고 2초 정지 · 어깨 힘 툭" : "입술 적시기 후 4·2·4 두 번 반복"}
        </Text>
      </View>
    </SafeAreaView>
  );
}
