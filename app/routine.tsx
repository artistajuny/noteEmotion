import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { track } from "@/lib/analytics";

export default function Routine() {
  const [sec, setSec] = useState<number>(60); // 초기값 넣기
  const timer = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    track("routine_started");
    timer.current = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  useEffect(() => { if (sec === 0) track("routine_completed"); }, [sec]);

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>⏱️ 1분 루틴</Text>
      <Text style={{ fontSize:36 }}>{sec}s</Text>
      <TouchableOpacity
        onPress={() => { track("routine_completed"); setSec(0); }}
        style={{ padding:12, backgroundColor:"#0a84ff", borderRadius:12 }}
      >
        <Text style={{ color:"#fff" }}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}
