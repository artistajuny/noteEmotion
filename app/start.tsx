import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { Routine } from "@/src/data/routines";
import { routines as ALL_ROUTINES } from "@/src/data/routines";

type Mode = "guided" | "quick";
const MAX_SELECT = 3;

export default function StartScreen() {
  const { mode = "guided", intensity, tag: tagParam, emotion, note } = useLocalSearchParams<{
    mode?: Mode;
    intensity?: string;
    tag?: string;                                // ✅ string으로 받기
    emotion?: "happy"|"calm"|"grateful"|"angry"|"sad"|"anxious"|"stressed"|"tired"|"neutral";
    note?: string;
  }>();
  const guided = (mode as Mode) === "guided";
  const beforeIntensity = intensity ? Number(intensity) : undefined;
  const selectedTag = typeof tagParam === "string" && tagParam.length ? tagParam : undefined; // ✅ 안전 처리
  const selectedEmotion = emotion as any | undefined;
  const beforeNote = (note ?? "").toString();

  const userLevel = 0;
  const userPoints = 0;

  const [idByTitle, setIdByTitle] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("routine").select("id,title").eq("status","active");
      if (error) {
        Alert.alert("루틴 목록 로딩 실패", error.message);
        setLoading(false);
        return;
      }
      const map: Record<string,string> = {};
      (data ?? []).forEach(r => map[r.title] = r.id);
      setIdByTitle(map);
      setLoading(false);
    })();
  }, []);

  // 태그로 필터 (문자열 기준)
  const list: Routine[] = useMemo(() => {
    const base = selectedTag
      ? ALL_ROUTINES.filter(r => r.tags.includes(selectedTag as any))
      : ALL_ROUTINES;
    return base.sort((a,b) => a.unlockLevel - b.unlockLevel);
  }, [selectedTag]);

  const isUnlocked = (r: Routine) => userLevel >= r.unlockLevel || userPoints >= r.unlockPoints;
  const lockedText  = (r: Routine) => `Lv${r.unlockLevel} 또는 ${r.unlockPoints}P 해금`;

  const [picked, setPicked] = useState<string[]>([]);
  const togglePick = (title: string, unlocked: boolean) => {
    if (!unlocked) return;
    setPicked(prev => {
      const i = prev.indexOf(title);
      if (i >= 0) { const cp = [...prev]; cp.splice(i,1); return cp; }
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, title];
    });
  };
  const orderBadge = (title: string) => {
    const idx = picked.indexOf(title);
    return idx >= 0 ? (idx + 1).toString() : null;
  };

  // 시작
  const startSequence = async () => {
    if (picked.length === 0) {
      Alert.alert("루틴을 선택해주세요", "최대 3개까지 선택 가능합니다.");
      return;
    }
    const [firstTitle, ...restTitles] = picked;
    const firstId = idByTitle[firstTitle];
    if (!firstId) {
      Alert.alert("루틴 미등록", `"${firstTitle}" 가 DB에 없습니다.`);
      return;
    }

    try {
      // 1) routine_run 사전값 insert
      const payload: any = { routine_id: firstId };
      if (guided && selectedEmotion && beforeIntensity !== undefined) {
        payload.emotion_before   = selectedEmotion;
        payload.before_intensity = beforeIntensity;
       
      }
      const { data: runRow, error: runErr } = await supabase
        .from("routine_run")
        .insert(payload)
        .select("id")
        .single();
      if (runErr) throw runErr;

      // 2) emotion_log insert (가이드형일 때만)
      let emotionLogId: string | undefined;
      if (guided && selectedEmotion && beforeIntensity !== undefined) {
        const { data: emoRow, error: emoErr } = await supabase
          .from("emotion_log")
          .insert({
            emotion: selectedEmotion,
            intensity: beforeIntensity,
            tag_code: selectedTag ?? null,                     // ✅ 문자열 그대로
            note: beforeNote.trim() ? beforeNote.trim() : null
          })
          .select("id")
          .single();
        if (emoErr) throw emoErr;
        emotionLogId = emoRow?.id;
      }

      const restIds = restTitles.map(t => idByTitle[t]).filter(Boolean);
      router.push({
        pathname: "/routines/run/[id]",
        params: {
          id: firstId,
          run_id: runRow!.id,
          mode: guided ? "guided" : "quick",
          nextQueue: JSON.stringify(restIds),
          emotion_log_id: emotionLogId ?? ""
        }
      });
    } catch (e:any) {
      Alert.alert("시작 실패", e?.message ?? "다시 시도해주세요.");
    }
  };

  if (loading) {
    return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><ActivityIndicator/></View>;
  }

  return (
    <View style={{ flex: 1, marginTop: 40}}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          {guided ? "루틴 선택 (가이드형)" : "빠른 루틴 시작"}
        </Text>
        {guided && beforeIntensity !== undefined && (
          <Text style={{ color: "#666", marginTop: 4 }}>
            사전 상태: {selectedTag ?? "—"} · 강도 {beforeIntensity}
          </Text>
        )}
        <Text style={{ color: "#666", marginTop: 8 }}>
          선택 {picked.length}/{MAX_SELECT}
        </Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(i) => i.title}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const unlocked = isUnlocked(item);
          const order = orderBadge(item.title);
          const selected = order !== null;
          return (
            <TouchableOpacity
              onPress={() => togglePick(item.title, unlocked)}
              disabled={!unlocked && !selected}
              style={{
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected ? "#333" : "#e5e5e5",
                backgroundColor: unlocked ? (selected ? "#f7f7f7" : "#fff") : "#f3f3f3",
                opacity: unlocked ? 1 : 0.65
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "800" }}>{item.title}</Text>
                {order && (
                  <View style={{
                    minWidth: 24, height: 24, borderRadius: 12,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 1, borderColor: "#333"
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: "700" }}>{order}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: "#666", marginTop: 4 }}>
                {item.category} · {unlocked ? "사용 가능" : `잠금 — Lv${item.unlockLevel} 또는 ${item.unlockPoints}P 해금`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: 20, paddingBottom: 35, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#eee"
      }}>
        <TouchableOpacity
          onPress={startSequence}
          disabled={picked.length === 0}
          style={{
            height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
            backgroundColor: picked.length === 0 ? "#ddd" : "#111"
          }}
        >
          <Text style={{ color: "white", fontWeight: "800"}}>
            {picked.length === 0 ? "루틴 선택" : `시작 (${picked.length}/3)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
