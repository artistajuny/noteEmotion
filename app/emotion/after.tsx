// app/emotion/after.tsx
import { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator, FlatList, ListRenderItem,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { calcSingleReward, getKindByCode } from "@/utils/rewards";

type EmotionKey =
  | "happy" | "calm" | "grateful"
  | "angry" | "sad" | "anxious" | "stressed" | "tired" | "neutral";

type EmotionMeta = { label: string; emoji: string };

const EMOTION_META: Record<EmotionKey, EmotionMeta> = {
  happy:    { label: "기쁨",          emoji: "😊" },
  calm:     { label: "여유(평온)",    emoji: "😌" },
  grateful: { label: "감사",          emoji: "🙏" },
  anxious:  { label: "불안",          emoji: "😟" },
  stressed: { label: "짜증/불편",     emoji: "😤" },
  sad:      { label: "슬픔",          emoji: "😢" },
  angry:    { label: "분노",          emoji: "😡" },
  tired:    { label: "무기력/피곤",   emoji: "🥱" },
  neutral:  { label: "중립",          emoji: "🙂" },
};

const EMOTIONS: EmotionKey[] = [
  "happy", "calm", "grateful",
  "anxious", "stressed", "angry",
  "sad", "tired", "neutral",
];

const NEG: EmotionKey[] = ["anxious","stressed","angry","sad","tired"];
const POS: EmotionKey[] = ["happy","calm","grateful"];

const metaOf = (key: EmotionKey | null | undefined): EmotionMeta =>
  EMOTION_META[(key ?? "neutral") as EmotionKey];

export default function EmotionAfter() {
  const { run_id, mode } = useLocalSearchParams<{ run_id: string; mode?: string }>();

  // 보상 계산을 위한 메타
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [routineCode, setRoutineCode] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // before 값
  const [beforeEmotion, setBeforeEmotion] = useState<EmotionKey | null>(null);
  const [beforeIntensity, setBeforeIntensity] = useState<number>(3);

  // after 값 (기본: before와 동일)
  const [emotion, setEmotion] = useState<EmotionKey | null>(null);
  const [intensity, setIntensity] = useState<number>(3);

  // “감정 바꾸기” 토글
  const [changeOpen, setChangeOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("routine_run")
          .select(`
            started_at,
            emotion_before,before_intensity,
            emotion_after,after_intensity,
            routine:routine_id ( code, is_premium )
          `)
          .eq("id", run_id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("해당 실행 기록을 찾을 수 없습니다.");

        const be = (data.emotion_before as EmotionKey) ?? "neutral";
        const bi = (data.before_intensity as number) ?? 3;

        setBeforeEmotion(be);
        setBeforeIntensity(bi);
        
        setEmotion((data.emotion_after as EmotionKey) ?? be);
        setIntensity((data.after_intensity as number) ?? bi);

        setStartedAt(data.started_at ?? null);
        const r = Array.isArray(data.routine) ? data.routine[0] : data.routine;
        setRoutineCode(r?.code ?? null);
        setIsPremium(Boolean(r?.is_premium));
      } catch (e: any) {
        Alert.alert("로드 실패", e?.message ?? "다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    })();
  }, [run_id]);

  const delta = useMemo(() => intensity - beforeIntensity, [beforeIntensity, intensity]);

  const isImproved = (before: EmotionKey, d: number) =>
    (NEG.includes(before) && d < 0) || (POS.includes(before) && d > 0);

  const save = async () => {
    if (!emotion) {
      Alert.alert("안내", "감정을 확인해주세요.");
      return;
    }
    try {
      setBusy(true);

      // 1) after + completed_at 저장
      const completedAt = new Date().toISOString();
      const { error } = await supabase
        .from("routine_run")
        .update({ emotion_after: emotion, after_intensity: intensity, completed_at: completedAt })
        .eq("id", run_id);

      if (error) throw error;

      // 2) 보상 계산
      const durSec = startedAt ? Math.max(0, (Date.parse(completedAt) - Date.parse(startedAt)) / 1000) : 0;
      const improved = isImproved((beforeEmotion ?? "neutral") as EmotionKey, delta);
      const kind = getKindByCode(routineCode ?? undefined);
      const { xp, points } = calcSingleReward({
        isPremium,
        kind,
        durationSec: durSec,
        emotionImproved: improved,
      });

      // 3) 지급
      try {
        const { error: rpcErr } = await supabase.rpc("apply_rewards", {
          p_xp: xp,
          p_points: points,
          p_reason: "routine_complete",
          p_meta: {
            code: routineCode,
            guided: mode === "guided",
            durationSec: durSec,
            emotionImproved: improved,
          },
          p_run_id: run_id,
        });
        if (rpcErr) console.warn("apply_rewards error", rpcErr);
      } catch (e) {
        console.warn("apply_rewards call failed", e);
      }

      // 4) 이벤트 로그(선택)
      try {
        await supabase.rpc("track_event", {
          p_name: "emotion_logged",
          p_props: { when: "after", emotion, intensity, run_id, delta },
        });
      } catch {}

      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const current = metaOf(emotion);
  const before = metaOf(beforeEmotion);

  type Item = EmotionKey;
  const renderItem: ListRenderItem<Item> = ({ item }) => {
    const on = emotion === item;
    const m = EMOTION_META[item];
    return (
      <TouchableOpacity
        onPress={() => setEmotion(item)}
        style={{
          flex: 1,
          backgroundColor: on ? "#e3fff1" : "#f6f7fb",
          borderColor: on ? "#22c55e" : "#eee",
          borderWidth: 1,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
        <Text style={{ fontWeight: "700" }}>{m.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, gap: 16, marginTop: 30 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>루틴 후 상태 확인</Text>

      {/* 루틴 전 */}
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#eef2f7",
          backgroundColor: "#fbfbfd",
        }}
      >
        <Text style={{ color: "#666", marginBottom: 6 }}>루틴 전</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 24 }}>{before.emoji}</Text>
          <Text style={{ fontWeight: "800" }}>{before.label}</Text>
          <Text style={{ color: "#888" }}>· 강도 {beforeIntensity}</Text>
        </View>
      </View>

      {/* 루틴 후 */}
      <View style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#eef2f7" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 24 }}>{current.emoji}</Text>
            <Text style={{ fontWeight: "800" }}>{current.label}</Text>
          </View>
          <TouchableOpacity onPress={() => setChangeOpen((v) => !v)}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>
              {changeOpen ? "감정 선택 닫기" : "감정 바꾸기"}
            </Text>
          </TouchableOpacity>
        </View>

        {changeOpen && (
          <View style={{ marginTop: 10 }}>
            <FlatList
              data={EMOTIONS}
              numColumns={3}
              keyExtractor={(k) => k}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ gap: 10 }}
              renderItem={renderItem}
            />
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", marginBottom: 6 }}>
            강도: {intensity} / 5{"  "}
            <Text style={{ color: delta === 0 ? "#6b7280" : delta < 0 ? "#16a34a" : "#dc2626" }}>
              {delta === 0 ? "변화 없음" : delta < 0 ? `↓ ${Math.abs(delta)}` : `↑ ${delta}`}
            </Text>
          </Text>

          <Slider
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={intensity}
            onValueChange={(v: number) => setIntensity(v)}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text>1</Text><Text>2</Text><Text>3</Text><Text>4</Text><Text>5</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        disabled={busy}
        onPress={save}
        style={{
          backgroundColor: "#111",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>완료</Text>
      </TouchableOpacity>
    </View>
  );
}
