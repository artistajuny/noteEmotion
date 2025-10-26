// app/routines/run/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";

// ⬇️ 당신 앱에 있는 실제 컴포넌트 이름/경로에 맞게 유지
import BreathingRoutine from "@/components/routines/BreathingRoutine";
import Sensory54321 from "@/components/routines/Sensory54321";
import BodyScanRoutine from "@/components/routines/BodyScanRoutine";
import PMRRapidRelease from "@/components/routines/PMRRapidRelease";
import NeckShoulderStretch1Min from "@/components/routines/NeckShoulderStretch1Min";
import HandRenewalMassage from "@/components/routines/HandRenewalMassage";
import Move1MinRoutine from "@/components/routines/Move1MinRoutine";
import DrinkWaterRoutine from "@/components/routines/DrinkWaterRoutine";
import MiniHydrateRoutine from "@/components/routines/MiniHydrateRoutine";
import SmallPlanRoutine from "@/components/routines/SmallPlanRoutine";
import AffirmationBasic from "@/components/routines/AffirmationBasic";
import Strengths3Routine from "@/components/routines/Strengths3Routine";
import SelfAckTodayRoutine from "@/components/routines/SelfAckTodayRoutine";

type Params = { id: string; run_id: string; mode?: string; nextQueue?: string };

export default function RunRoutine() {
  const { id: routineId, run_id, mode, nextQueue } = useLocalSearchParams<Params>();
  const guided = mode === "guided";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState<string>("");

  const restQueue = useMemo<string[]>(
    () => (nextQueue ? (JSON.parse(String(nextQueue)) as string[]) : []),
    [nextQueue]
  );

  // 루틴 메타 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("routine")
          .select("title, code")
          .eq("id", routineId)
          .maybeSingle();
        if (error) throw error;
        if (alive && data) {
          setTitle(data.title ?? "");
          setCode(data.code ?? "");
        }
      } catch (e: any) {
        Alert.alert("에러", e?.message ?? "루틴 정보를 불러오지 못했어요.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [routineId]);

  // ▶ 다음 큐 시작 (⭐ before 감정/강도 복사 패치 적용)
  const startNextFromQueue = async (modeToUse: "guided" | "quick") => {
    if (restQueue.length === 0) return;
    setBusy(true);
    try {
      const nextId = restQueue[0];
      const remains = restQueue.slice(1);

      // 현재 run의 before 값 조회
      const { data: cur, error: curErr } = await supabase
        .from("routine_run")
        .select("emotion_before,before_intensity")
        .eq("id", run_id)
        .maybeSingle();
      if (curErr) throw curErr;

      const payload: any = { routine_id: nextId };
      if (cur?.emotion_before != null) payload.emotion_before = cur.emotion_before;
      if (cur?.before_intensity != null) payload.before_intensity = cur.before_intensity;

      // 다음 run 생성
      const { data: created, error: insertErr } = await supabase
        .from("routine_run")
        .insert(payload)
        .select("id")
        .maybeSingle();
      if (insertErr) throw insertErr;

      router.replace({
        pathname: "/routines/run/[id]",
        params: {
          id: String(nextId),
          run_id: String(created!.id),
          mode: modeToUse,
          nextQueue: JSON.stringify(remains),
        },
      });
    } catch (e: any) {
      Alert.alert("에러", e?.message ?? "다음 루틴을 시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  // 완료 버튼
  const handleDone = async () => {
    if (guided && restQueue.length > 0) {
      await startNextFromQueue("guided");
      return;
    }
    // 마지막이면 애프터 화면으로
    router.replace({
      pathname: "/emotion/after",
      params: { run_id: String(run_id), mode: guided ? "guided" : "quick" },
    });
  };

  // 취소/나가기
  const handleCancel = () => {
    Alert.alert("나가기", "현재 루틴을 종료할까요?", [
      { text: "아니오" },
      {
        text: "예",
        style: "destructive",
        onPress: () => {
          router.back();
        },
      },
    ]);
  };

  // 루틴 코드 → 컴포넌트 매핑
  const renderRoutine = () => {
    // 각 컴포넌트의 Props는 프로젝트 실제 정의에 맞춰 onDone만 안전하게 전달
    switch (code) {
      case "breathing_478":
      case "breathing":
        return <BreathingRoutine onDone={handleDone} />;
      case "sensory_54321":
      case "54321":
        return <Sensory54321 onDone={handleDone} />;
      case "body_scan_short":
        return <BodyScanRoutine onDone={handleDone} />;
      case "pmr-rapid-release":
        return <PMRRapidRelease onDone={handleDone} guided={guided} />;
      case "stretch_1min":
        return <NeckShoulderStretch1Min onDone={handleDone} guided={guided} />;
      case "hand_massage":
        return <HandRenewalMassage onDone={handleDone} guided={guided} />;
      case "move_1min":
        return <Move1MinRoutine onDone={handleDone} />;
      case "drink_water":
        return <DrinkWaterRoutine onDone={handleDone} />;
      case "mini_hydrate":
        return <MiniHydrateRoutine onDone={handleDone} />;
      case "small_plan":
        return <SmallPlanRoutine onDone={handleDone} />;
      case "affirmation_basic": 
        return <AffirmationBasic guided={guided} onDone={handleDone} />;
      case "strengths3": 
        return <Strengths3Routine guided={guided} onDone={handleDone} />;
      case "self_care": 
        return <SelfAckTodayRoutine guided={guided} onDone={handleDone} />;
      default:
        return (
          <View style={{ padding: 16 }}>
            <Text>준비 중인 루틴입니다. (code: {code || "unknown"})</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
  
      {/* 본문 */}
      <View style={{ flex: 1 }}>{renderRoutine()}</View>

    </View>
  );
}
