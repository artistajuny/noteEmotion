// app/start.tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { EmotionType, Routine } from "@/app/data/routines";
import { routines as ALL_ROUTINES } from "@/app/data/routines";

type Mode = "guided" | "quick";

export default function StartScreen() {
  const { mode = "guided", emotion, intensity } = useLocalSearchParams<{
    mode?: Mode; emotion?: EmotionType; intensity?: string;
  }>();
  const guided = (mode as Mode) === "guided";
  const selectedEmotion = (emotion as EmotionType) || undefined;
  const beforeIntensity = intensity ? Number(intensity) : undefined;

  // TODO: 유저 레벨/포인트는 프로필 연동 후 교체
  const userLevel = 0;
  const userPoints = 0;

  // DB routine(title->id) 매핑 (실행 시 필요)
  const [idByTitle, setIdByTitle] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("routine")
        .select("id,title")
        .eq("status", "active");
      if (error) {
        Alert.alert("루틴 목록 로딩 실패", error.message);
        setLoading(false);
        return;
      }
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => (map[r.title] = r.id));
      setIdByTitle(map);
      setLoading(false);
    })();
  }, []);

  // 감정별 필터 + 잠금 우선순위 정렬
  const list: Routine[] = useMemo(() => {
    const base = selectedEmotion
      ? ALL_ROUTINES.filter(r => r.emotions.includes(selectedEmotion))
      : ALL_ROUTINES;
    return base.sort((a, b) => a.unlockLevel - b.unlockLevel);
  }, [selectedEmotion]);

  const lockedText = (r: Routine) => `Lv${r.unlockLevel} 또는 ${r.unlockPoints}P 해금`;
  const isUnlocked = (r: Routine) =>
    userLevel >= r.unlockLevel || userPoints >= r.unlockPoints;

  const start = async (routineTitle: string) => {
    const routine_id = idByTitle[routineTitle];
    if (!routine_id) {
      Alert.alert("루틴 미등록", "DB에 동일 제목의 루틴이 없습니다. (routine.title)");
      return;
    }
    try {
      const payload: any = { routine_id };
      if (guided && selectedEmotion && beforeIntensity !== undefined) {
        payload.emotion_before = selectedEmotion;
        payload.before_intensity = beforeIntensity;
      }
      const { data, error } = await supabase
        .from("routine_run")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      router.push({
        pathname: "/routines/run/[id]",
        params: { id: routine_id, run_id: data!.id, mode: guided ? "guided" : "quick" },
      });
    } catch (e: any) {
      Alert.alert("시작 실패", e?.message ?? "다시 시도해주세요.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        {guided ? "루틴 선택 (가이드형)" : "빠른 루틴 시작"}
      </Text>
      {guided && selectedEmotion && beforeIntensity !== undefined && (
        <Text style={{ color: "#666" }}>
          사전 감정: {selectedEmotion} · 강도 {beforeIntensity}
        </Text>
      )}

      <FlatList
        data={list}
        keyExtractor={(i) => i.title}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const unlocked = isUnlocked(item);
          return (
            <TouchableOpacity
              disabled={!unlocked}
              onPress={() => start(item.title)}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: unlocked ? "#eee" : "#ddd",
                backgroundColor: unlocked ? "#fafafa" : "#f3f3f3",
                opacity: unlocked ? 1 : 0.6,
              }}
            >
              <Text style={{ fontWeight: "800" }}>{item.title}</Text>
              <Text style={{ color: "#666", marginTop: 4 }}>
                {item.category} · {unlocked ? "사용 가능" : lockedText(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
