// components/routines/Sensory54321.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import * as Haptics from "expo-haptics";

type Phase = 5|4|3|2|1;

const LABELS: Record<Phase, {title:string; hint:string; placeholder:string}> = {
  5: { title:"보이는 것 5개", hint:"시야에 들어오는 구체적 대상", placeholder:"한 줄에 하나씩 (엔터로 줄바꿈)" },
  4: { title:"들리는 소리 4개", hint:"멀리/가까이/내 주변 소리", placeholder:"예) 에어컨, 바람, 옆방 말소리…" },
  3: { title:"느껴지는 촉감 3개", hint:"의자, 옷감, 바닥, 체온 등", placeholder:"예) 의자 등받이, 손 따뜻함…" },
  2: { title:"냄새 2개", hint:"약한 향도 OK", placeholder:"예) 커피, 비누…" },
  1: { title:"맛 1개", hint:"입안의 잔향/미세한 맛", placeholder:"예) 치약 잔맛…" },
};

export default function Sensory54321({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>(5);
  const [value, setValue] = useState<string>("");
  const [progress, setProgress] = useState<number>(0); // 0~5
  const inputRef = useRef<TextInput>(null);

  const lines = useMemo(() => value.split("\n").map(s=>s.trim()).filter(Boolean), [value]);
  const needed = phase;
  const ok = lines.length >= needed;

  const next = async () => {
    if (!ok) return;
    await Haptics.selectionAsync();
    if (phase === 1) {
      onDone();
      return;
    }
    // 다음 단계
    const nextPhase = (phase - 1) as Phase;
    setPhase(nextPhase);
    setValue("");
    setProgress((p)=>p+1);
    setTimeout(()=>inputRef.current?.focus(), 0);
  };

  useEffect(()=>{ setProgress(0); setTimeout(()=>inputRef.current?.focus(), 200); },[]);

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:"#fff" }} behavior={Platform.OS==="ios"?"padding":undefined}>
      <ScrollView contentContainerStyle={{ padding:16, gap:14 }}>
        {/* 헤더 */}
        <View>
          <Text style={{ marginTop : 50 , fontSize:20, fontWeight:"800" }}>5-4-3-2-1 감각 인지</Text>
          <Text style={{ color:"#6B7280", marginTop:4 }}>지금 이 순간의 감각에 주의를 돌려 마음을 안정합니다.</Text>
        </View>

        {/* 진행도 */}
        <View style={{ flexDirection:"row", gap:6 }}>
          {[0,1,2,3,4].map((i)=>(
            <View key={i} style={{
              flex:1, height:6, borderRadius:6,
              backgroundColor: i < progress ? "#111" : "#E5E7EB"
            }}/>
          ))}
        </View>

        {/* 카드 */}
        <View style={{ backgroundColor:"#F7F8FB", borderRadius:12, padding:14, borderWidth:1, borderColor:"#EEF1F5" }}>
          <Text style={{ fontSize:16, fontWeight:"800" }}>{LABELS[phase].title}</Text>
          <Text style={{ color:"#6B7280", marginTop:6 }}>{LABELS[phase].hint}</Text>

          <TextInput
            ref={inputRef}
            placeholder={LABELS[phase].placeholder}
            value={value}
            onChangeText={setValue}
            multiline
            style={{ marginTop:10, minHeight:120, borderWidth:1, borderColor:"#E5E7EB", borderRadius:10, padding:12, backgroundColor:"#fff" }}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <Text style={{ color: ok ? "#10B981" : "#9CA3AF", marginTop:6 }}>
            {lines.length} / {needed}
          </Text>
        </View>

        {/* 액션 */}
        <TouchableOpacity
          onPress={next}
          disabled={!ok}
          style={{
            backgroundColor: ok ? "#111" : "#9CA3AF",
            padding:14, borderRadius:12, alignItems:"center"
          }}
        >
          <Text style={{ color:"#fff", fontWeight:"800" }}>{phase === 1 ? "완료" : "다음"}</Text>
        </TouchableOpacity>

        {/* 눈감고 진행 팁 */}
        <Text style={{ textAlign:"center", color:"#6B7280" }}>
          눈을 감고 진행하고 싶다면, 한 단계 끝날 때마다 버튼만 눌러도 됩니다.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
