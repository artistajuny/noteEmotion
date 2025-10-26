// app/emotion/new.tsx
import { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, Alert, FlatList, ListRenderItem,
  SafeAreaView, ScrollView, TextInput
} from "react-native";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";

type EmotionKey =
  | "happy" | "calm" | "grateful"
  | "angry" | "sad" | "anxious" | "stressed" | "tired" | "neutral";

type TagCluster = "positive" | "tense" | "low" | "neutral";

type EmotionItem = { key: EmotionKey; label: string; emoji: string; tag: TagCluster };

const EMOTIONS: EmotionItem[] = [
  { key: "happy",   label: "기쁨",          emoji: "😊", tag: "positive" },
  { key: "calm",    label: "여유(평온)",    emoji: "😌", tag: "positive" },
  { key: "happy",   label: "설렘(기대)",    emoji: "🤩", tag: "positive" },

  { key: "anxious",  label: "불안",         emoji: "😟", tag: "tense" },
  { key: "stressed", label: "짜증(불편)",   emoji: "😤", tag: "tense" },
  { key: "angry",    label: "분노",         emoji: "😡", tag: "tense" },

  { key: "sad",   label: "슬픔",         emoji: "😢", tag: "low" },
  { key: "tired", label: "무기력(공허)", emoji: "😶‍🌫️", tag: "low" },
  { key: "neutral", label: "중립",         emoji: "🙂", tag: "low" },
];

export default function EmotionNew() {
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [memo, setMemo] = useState("");
  const maxLen = 120;

  const pickedItem = useMemo(
    () => (pickedIdx === null ? null : EMOTIONS[pickedIdx]),
    [pickedIdx]
  );

  const goNext = () => {
    if (pickedIdx === null) return Alert.alert("안내", "감정을 선택해주세요.");
    const item = EMOTIONS[pickedIdx];

    // ✅ DB 저장 없이 파라미터로만 전달
    router.replace({
      pathname: "/start",
      params: {
        mode: "guided",
        tag: item.tag,                  // 문자열 그대로 전달 (positive/tense/low/neutral)
        emotion: item.key,              // emotion_type enum
        intensity: String(intensity),   // "1"~"5"
        note: memo.trim() || ""
      },
    });
  };

  const renderItem: ListRenderItem<EmotionItem> = ({ item, index }) => {
    const on = pickedIdx === index;
    return (
      <TouchableOpacity
        onPress={() => setPickedIdx(index)}
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
        <Text style={{ fontWeight: "800", fontSize: 15, color: "#111" }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const disabled = pickedIdx === null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 50, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
            지금 가장 가까운 감정은?
          </Text>
          <Text style={{ marginTop: 6, color: "#6b7280" }}>
            {pickedItem
              ? `${pickedItem.emoji} ${pickedItem.label} · 강도 ${intensity}`
              : "딱 맞지 않아도 돼요. 가장 가까운 걸 고르고 강도를 정하세요."}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}>
          <FlatList
            data={EMOTIONS}
            numColumns={3}
            keyExtractor={(_, i) => String(i)}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            contentContainerStyle={{ paddingTop: 4 }}
            scrollEnabled={false}
            renderItem={renderItem}
          />

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
              {[1, 2, 3, 4, 5].map((n) => (
                <Text
                  key={n}
                  style={{
                    color: n === intensity ? "#111" : "#9CA3AF",
                    fontWeight: n === intensity ? "800" : "400",
                  }}
                >
                  {n}
                </Text>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "800", color: "#111", marginBottom: 6 }}>메모 (선택)</Text>
            <TextInput
              placeholder="예: 왜 이렇게 느꼈는지 간단히 적어두기"
              value={memo}
              onChangeText={(t) => t.length <= maxLen && setMemo(t)}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: "#EEF2F7",
                borderRadius: 12,
                padding: 12,
                textAlignVertical: "top",
                backgroundColor: "#FBFBFD",
              }}
            />
            <Text style={{ alignSelf: "flex-end", color: "#9CA3AF", marginTop: 4 }}>
              {memo.length}/{maxLen}
            </Text>
          </View>
        </ScrollView>

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: 16,
            marginBottom: 30,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
          }}
        >
          <TouchableOpacity
            disabled={disabled}
            onPress={goNext}
            style={{
              backgroundColor: disabled ? "#C7CDD9" : "#111827",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              {disabled ? "감정을 먼저 선택하세요" : "루틴 선택으로 이동"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
