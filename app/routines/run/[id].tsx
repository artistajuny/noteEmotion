import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RunRoutine() {
  const { id: routineId, run_id, mode } = useLocalSearchParams<{ id:string; run_id:string; mode?: string }>();
  const guided = mode === "guided";

  const [title, setTitle] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("routine").select("title").eq("id", routineId).single();
      if (error) return;
      setTitle(data?.title ?? "");
    })();
  }, [routineId]);

  const complete = async () => {
    try {
      setBusy(true);
      const { error } = await supabase.from("routine_run")
        .update({ completed_at: new Date().toISOString(), xp_awarded: 5 })
        .eq("id", run_id);
      if (error) throw error;

      if (guided) {
        router.replace({ pathname: "/emotion/after", params: { run_id } });
      } else {
        Alert.alert("완료", "루틴이 완료되었습니다.");
        router.replace("/(tabs)");
      }
    } catch (e:any) {
      Alert.alert("오류", e?.message ?? "다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (!title) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;

  return (
    <View style={{ flex:1, padding:20, gap:16 }}>
      <Text style={{ fontSize:20, fontWeight:"800" }}>{title}</Text>
      <Text style={{ color:"#666" }}>MVP: 세부 스텝/타이머는 추후</Text>

      <TouchableOpacity
        disabled={busy}
        onPress={complete}
        style={{ backgroundColor:"#111", padding:14, borderRadius:12, alignItems:"center", opacity: busy?0.6:1 }}
      >
        <Text style={{ color:"#fff", fontWeight:"800" }}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}
