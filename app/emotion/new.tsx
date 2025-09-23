// app/emotion/new.tsx
import { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, Alert, FlatList, ListRenderItem,
  SafeAreaView, ScrollView
} from "react-native";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
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

export default function EmotionNew() {
  const [picked, setPicked] = useState<EmotionKey | null>(null);
  const [intensity, setIntensity] = useState<number>(3);

  const pickedItem = useMemo(
    () => EMOTIONS.find(e => e.key === picked) ?? null,
    [picked]
  );

  const save = async () => {
    if (!picked) return Alert.alert("안내", "감정을 선택해주세요.");
    try {
      const { error } = await supabase.from("emotion_log").insert({ emotion: picked, intensity });
      if (error) throw error;

      // (선택) 이벤트 로깅 실패 무시
      try {
        await supabase.rpc("track_event", {
          p_name: "emotion_logged",
          p_props: { when: "before", emotion: picked, intensity },
        });
      } catch {}

      router.replace({
        pathname: "/start",
        params: { mode: "guided", emotion: picked, intensity: String(intensity) },
      });
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "다시 시도해주세요.");
    }
  };

  const renderItem: ListRenderItem<EmotionItem> = ({ item }) => {
    const on = picked === item.key;
    return (
      <TouchableOpacity
        onPress={() => setPicked(item.key)}
        style={{
          flex: 1,
          paddingVertical: 18,
          borderRadius: 16,
          alignItems: "center",
          gap: 8,
          backgroundColor: on ? "#F1F5FF" : "#FBFBFD",
          borderWidth: 1.5,
          borderColor: on ? "#6B8CFF" : "#ECECF2",
          shadowColor: "#000",
          shadowOpacity: on ? 0.12 : 0.04,
          shadowRadius: on ? 8 : 4,
          elevation: on ? 3 : 1,
        }}
      >
        <Text style={{ fontSize: 30 }}>{item.emoji}</Text>
        <Text style={{ fontWeight: "800", fontSize: 15, color: "#111" }}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const disabled = !picked;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        {/* 헤더 */}
        <View style={{marginTop: 50, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>지금 기분은 어떤가요?</Text>
          <Text style={{ marginTop: 6, color: "#6b7280" }}>
            {pickedItem ? `${pickedItem.emoji} ${pickedItem.label} · 강도 ${intensity}` : "감정을 선택하고 강도를 조절하세요"}
          </Text>
        </View>

        {/* 콘텐츠 스크롤 영역 */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}>
          {/* 3x3 그리드 */}
          <FlatList
            data={EMOTIONS}
            numColumns={3}
            keyExtractor={(i) => i.key}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            contentContainerStyle={{ paddingTop: 4 }}
            scrollEnabled={false}
            renderItem={renderItem}
          />

          {/* 슬라이더 카드 */}
          <View
            style={{
              marginTop: 12,
              backgroundColor: "#F8FAFC",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "#EEF2F7",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontWeight: "800", color: "#111" }}>강도</Text>
              <Text style={{ color: "#6b7280" }}>{intensity} / 5</Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={intensity}
              onValueChange={(v: number) => setIntensity(v)}
              minimumTrackTintColor="#111827"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#111827"
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {[1,2,3,4,5].map((n) => (
                <Text key={n} style={{ color: n===intensity ? "#111" : "#9CA3AF", fontWeight: n===intensity ? "800" : "400" }}>
                  {n}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* 하단 고정 CTA */}
        <View
          style={{
            position: "absolute",
            left: 0, right: 0, bottom: 0,
            padding: 16,
            marginBottom:30,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
          }}
        >
          <TouchableOpacity
            disabled={disabled}
            onPress={save}
            style={{
              backgroundColor: disabled ? "#C7CDD9" : "#111827",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              {disabled ? "감정을 먼저 선택하세요" : "저장하고 루틴 선택"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
