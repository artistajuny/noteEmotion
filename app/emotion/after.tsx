import { useState } from "react";
import { View, Text, TouchableOpacity, Alert, FlatList, ListRenderItem } from "react-native";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";

type EmotionKey = "happy"|"calm"|"grateful"|"angry"|"sad"|"anxious"|"stressed"|"tired"|"neutral";
type EmotionItem = { key: EmotionKey; label: string; emoji: string };

const EMOTIONS: EmotionItem[] = [
  { key: "happy", label: "행복", emoji: "😊" },
  { key: "calm", label: "차분", emoji: "😌" },
  { key: "grateful", label: "감사", emoji: "🙏" },
  { key: "angry", label: "분노", emoji: "😡" },
  { key: "sad", label: "슬픔", emoji: "😢" },
  { key: "anxious", label: "불안", emoji: "😟" },
  { key: "stressed", label: "스트레스", emoji: "😣" },
  { key: "tired", label: "피곤", emoji: "🥱" },
  { key: "neutral", label: "평온", emoji: "😐" },
];

export default function EmotionAfter() {
  const { run_id } = useLocalSearchParams<{ run_id: string }>();
  const [picked, setPicked] = useState<EmotionKey | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!picked) return Alert.alert("안내", "감정을 선택해주세요.");
    try {
      setBusy(true);
      const { error } = await supabase.from("routine_run")
        .update({ emotion_after: picked, after_intensity: intensity })
        .eq("id", run_id);
      if (error) throw error;
      router.replace("/(tabs)");
    } catch (e:any) {
      Alert.alert("저장 실패", e?.message ?? "다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const renderItem: ListRenderItem<EmotionItem> = ({ item }) => {
    const on = picked === item.key;
    return (
      <TouchableOpacity
        onPress={() => setPicked(item.key)}
        style={{
          flex: 1, backgroundColor: on ? "#e3fff1" : "#f6f7fb",
          borderColor: on ? "#22c55e" : "#eee", borderWidth: 1,
          paddingVertical: 14, borderRadius: 12, alignItems: "center", gap: 6,
        }}
      >
        <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        <Text style={{ fontWeight: "700" }}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex:1, padding:20, gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:"800" }}>지금은 어떤가요?</Text>
      <Text style={{ color:"#666" }}>루틴 후 감정과 강도를 기록합니다.</Text>

      <FlatList
        data={EMOTIONS}
        numColumns={3}
        keyExtractor={(i)=>i.key}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10 }}
        renderItem={renderItem}
      />

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize:14, fontWeight:"700", marginBottom:6 }}>강도: {intensity}</Text>
        <Slider minimumValue={1} maximumValue={5} step={1} value={intensity} onValueChange={(v:number)=>setIntensity(v)} />
        <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
          <Text>1</Text><Text>2</Text><Text>3</Text><Text>4</Text><Text>5</Text>
        </View>
      </View>

      <TouchableOpacity
        disabled={busy}
        onPress={save}
        style={{ backgroundColor:"#111", padding:14, borderRadius:12, alignItems:"center", opacity: busy?0.6:1 }}
      >
        <Text style={{ color:"#fff", fontWeight:"800" }}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}
