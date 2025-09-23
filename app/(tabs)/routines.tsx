import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RoutinesReport() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ week_runs: number; avg_delta?: number } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 최소 집계 예시: 이번 주 완료 수
        const { data: runs, error } = await supabase
          .from("routine_run")
          .select("id, before_intensity, after_intensity, completed_at")
          .not("completed_at", "is", null)
          .gte("completed_at", new Date(Date.now() - 7*24*60*60*1000).toISOString())
          .order("completed_at", { ascending: false });
        if (error) throw error;

        const week_runs = runs?.length ?? 0;
        const deltas = (runs ?? [])
          .map(r => (typeof r.before_intensity === "number" && typeof r.after_intensity === "number")
            ? (r.before_intensity - r.after_intensity)
            : null)
          .filter((x): x is number => x !== null);
        const avg_delta = deltas.length ? (deltas.reduce((a,b)=>a+b,0)/deltas.length) : undefined;

        setSummary({ week_runs, avg_delta });
      } catch (e:any) {
        Alert.alert("로딩 실패", e?.message ?? "다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;

  return (
    <View style={{ flex:1, padding:16, gap:14 }}>
      <Text style={{ fontSize:20, fontWeight:"800" }}>루틴 리포트</Text>

      <View style={{ backgroundColor:"#fafafa", borderRadius:12, padding:14, gap:6, borderWidth:1, borderColor:"#eee" }}>
        <Text style={{ fontSize:14, color:"#555" }}>이번 주 완료</Text>
        <Text style={{ fontSize:22, fontWeight:"800" }}>{summary?.week_runs ?? 0} 회</Text>
      </View>

      <View style={{ backgroundColor:"#fafafa", borderRadius:12, padding:14, gap:6, borderWidth:1, borderColor:"#eee" }}>
        <Text style={{ fontSize:14, color:"#555" }}>평균 강도 변화(전-후)</Text>
        <Text style={{ fontSize:22, fontWeight:"800" }}>
          {summary?.avg_delta !== undefined ? `${summary!.avg_delta.toFixed(2)} 점 ↓` : "데이터 없음"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={()=>router.push("/(tabs)/history")}
        style={{ backgroundColor:"#111", padding:14, borderRadius:12, alignItems:"center" }}
      >
        <Text style={{ color:"#fff", fontWeight:"800" }}>상세 히스토리 보기</Text>
      </TouchableOpacity>
    </View>
  );
}
