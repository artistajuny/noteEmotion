import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import * as Haptics from "expo-haptics";

type Step = { label: string; hint: string; duration: number };
const STEPS: Step[] = [
  { label: "입술 적시기", hint: "입을 다문 채 혀로 침을 돌려 입술을 부드럽게 적셔요.", duration: 10 },
  { label: "호흡 4-2-4 ×2", hint: "코 4초 들숨 · 2초 멈춤 · 입 4초 날숨(두 번 반복).", duration: 20 },
  { label: "릴리즈", hint: "어깨를 들어올렸다 툭 떨어뜨리고 손가락을 털어요.", duration: 15 },
];

export default function MiniHydrateRoutine({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(STEPS[0].duration);
  const pulse = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };
  useEffect(() => { startPulse(); }, []);

  useEffect(() => {
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
  }, [idx]);

  const next = async () => {
    await Haptics.selectionAsync();
    if (idx >= STEPS.length - 1) { onDone(); return; }
    const n = idx + 1;
    setIdx(n);
    setLeft(STEPS[n].duration);
  };

  const cur = STEPS[idx];

  return (
    <View style={{ flex:1, backgroundColor:"#fff", padding:20, gap:14 }}>
      <View style={{ alignItems:"center", marginTop: 35 }}>
        <Text style={{ fontSize:20, fontWeight:"900" }}>미니 수분 루틴 (45초)</Text>
        <Text style={{ color:"#6b7280", marginTop:6 }}>
          물이 없어도 가능한 수분감+호흡+이완 루틴
        </Text>
      </View>

      <View style={{ flexDirection:"row", justifyContent:"center", gap:8 }}>
        {STEPS.map((_, i) => (
          <View key={i} style={{
            width:10, height:10, borderRadius:5,
            backgroundColor: i <= idx ? "#111" : "#E5E7EB",
            opacity: i === idx ? 1 : 0.7
          }}/>
        ))}
      </View>

      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <Animated.View style={{
          width:240, minHeight:180, borderRadius:16, padding:16,
          backgroundColor:"#F7F8FB", borderWidth:1, borderColor:"#EEF1F5",
          transform:[{ scale:pulse }],
          alignItems:"center", justifyContent:"center", gap:10
        }}>
          <Text style={{ fontSize:18, fontWeight:"900" }}>{cur.label}</Text>
          <Text style={{ color:"#555", textAlign:"center" }}>{cur.hint}</Text>
          <Text style={{ fontSize:48, fontWeight:"900", marginTop:8 }}>{left}</Text>
        </Animated.View>
      </View>

      <View style={{ paddingBottom:10 }}>
        <TouchableOpacity
          onPress={next}
          style={{
            backgroundColor:"#111", paddingVertical:14,
            borderRadius:12, alignItems:"center"
          }}
        >
          <Text style={{ color:"#fff", fontWeight:"900" }}>
            {idx >= STEPS.length - 1 ? "완료" : "다음"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
