// components/routines/SmallPlanRoutine.tsx
// 스몰플랜 + 백그라운드 알림 타이머
// - 루틴 완료는 "타이머 종료 시점"에 호출되도록 수정

import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

type Props = { onDone: () => void };

const UI = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E5E7EB",
  text: "#0F172A", sub: "#475569", primary: "#111827",
};

const chipsTask  = ["메일 1통", "파일 정리 5개", "책 3쪽", "바닥 먼지 줍기", "물건 3개 제자리"];
const chipsPlace = ["지금 자리", "책상", "조용한 곳", "카페", "현관 앞"];
const chipsTime  = ["3분", "5분", "10분", "15분"];

// 알림 준비
async function ensureNotificationsReady() {
  await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("smallplan", {
      name: "SmallPlan",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

// 알림 예약
async function scheduleSmallPlanTimer(task: string, minutes: number) {
  const secs = Math.max(1, minutes * 60);

  // 시작 알림(1초 뒤) 채널 지정
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "스몰 플랜 시작",
      body: `지금 ${minutes}분: ${task}`,
      sound: true,
      data: { type: "smallplan_start", task, minutes },
    },
    trigger: { seconds: 1, channelId: "smallplan" },
  });

  if (secs > 60) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "거의 끝!", body: "1분만 더 유지해요 💪", sound: false },
      trigger: { seconds: secs - 60, channelId: "smallplan" },
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "완료 ✅",
      body: `${task} 끝! 짧아도 잘했어요.`,
      sound: true,
      data: { type: "smallplan_done", task, minutes },
    },
    trigger: { seconds: secs, channelId: "smallplan" },
  });
}

export default function SmallPlanRoutine({ onDone }: Props) {
  // plan steps
  const [step, setStep] = useState<0|1|2>(0);
  const [task, setTask] = useState("");
  const [place, setPlace] = useState("지금 자리");
  const [minutes, setMinutes] = useState(5);
  const [startWhen, setStartWhen] = useState<"지금"|"끝나고">("지금");
  const [barrier, setBarrier] = useState("");

  // 실행 모드
  const [mode, setMode] = useState<"plan"|"countdown"|"done">("plan");
  const [endAt, setEndAt] = useState<number | null>(null); // epoch ms
  const [leftSec, setLeftSec] = useState(0);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    ensureNotificationsReady();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // 카운트다운 루프 (앱 재진입 시 남은 시간 재계산)
  useEffect(() => {
    if (mode !== "countdown" || !endAt) return;
    const tick = () => {
      const now = Date.now();
      const remain = Math.max(0, Math.ceil((endAt - now) / 1000));
      setLeftSec(remain);
      if (remain <= 0) {
        finishTimer();
      }
    };
    tick(); // 바로 1회 갱신
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [mode, endAt]);

  const canNext0 = task.trim().length >= 2;
  const canNext1 = place.length > 0 && minutes > 0;

  const summary = useMemo(() => {
    const plan = `나는 ${startWhen} ${place}에서 ${minutes}분 동안 ‘${task.trim()}’을(를) 한다.`;
    const risk = barrier.trim() ? `\n가능한 방해: ${barrier.trim()} → 대응: 휴대폰 무음/1분 버퍼.` : "";
    return plan + risk;
  }, [task, place, minutes, startWhen, barrier]);

  const pressNext = async () => {
    await Haptics.selectionAsync();
    if (mode !== "plan") return;

    if (step === 0 && canNext0) return setStep(1);
    if (step === 1 && canNext1) return setStep(2);
    if (step === 2) {
      // 알림 예약
      const label = task || "스몰 플랜";
      await scheduleSmallPlanTimer(label, minutes);

      // 카운트다운 진입(완료는 타이머 끝나면 호출)
      const end = Date.now() + Math.max(1, minutes * 60) * 1000;
      setEndAt(end);
      setMode("countdown");

      Alert.alert("알림 예약됨", `${minutes}분 타이머가 시작됩니다.\n앱을 닫아도 알림으로 알려드릴게요.`);
    }
  };

  const finishTimer = async () => {
    if (mode === "done") return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode("done");
    onDone(); // ✅ 이제 여기서만 완료 기록
  };

  const Chip = ({ label, onPress, active=false }:{label:string; onPress:()=>void; active?:boolean}) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical:8, paddingHorizontal:12, borderRadius:999,
        backgroundColor: active ? UI.primary : "#F1F5F9",
        borderWidth: active ? 0 : 1, borderColor: UI.border, marginRight:8, marginBottom:8
      }}
    >
      <Text style={{ color: active ? "#fff" : UI.text, fontWeight:"700" }}>{label}</Text>
    </TouchableOpacity>
  );

  // ====== UI ======
  if (mode === "countdown") {
    const m = Math.floor(leftSec / 60);
    const s = leftSec % 60;
    const mmss = `${m}:${s.toString().padStart(2, "0")}`;

    return (
      <View style={{ flex:1, backgroundColor: UI.bg, padding:20 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color: UI.text, textAlign:"center", marginTop:10 }}>
          스몰 플랜 실행 중
        </Text>
        <Text style={{ fontSize:13, color: UI.sub, textAlign:"center", marginTop:6 }}>
          {place} · {minutes}분 · ‘{task || "스몰 플랜"}’
        </Text>

        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <Animated.View style={{
            width: 280, minHeight: 200, borderRadius: 18, padding: 16,
            backgroundColor: UI.card, borderWidth:1, borderColor: UI.border,
            transform:[{ scale:pulse }], alignItems:"center", justifyContent:"center"
          }}>
            <Text style={{ fontSize:16, fontWeight:"900", color: UI.text }}>남은 시간</Text>
            <Text style={{ fontSize:56, fontWeight:"900", color: UI.text, marginTop:8 }}>{mmss}</Text>
            <Text style={{ fontSize:13, color: UI.sub, textAlign:"center", marginTop:10 }}>
              앱을 닫아도 알림으로 완료를 알려드려요.
            </Text>
          </Animated.View>
        </View>

        <View style={{ paddingTop:0 }}>
          <TouchableOpacity
            onPress={finishTimer}
            style={{ height:52, borderRadius:14, alignItems:"center", justifyContent:"center", backgroundColor: UI.primary }}
          >
            <Text style={{ color:"#fff", fontWeight:"900", fontSize:16 }}>지금 완료로 기록</Text>
          </TouchableOpacity>
          <Text style={{ fontSize:12, color: UI.sub, textAlign:"center", marginTop:8 }}>
            조기 종료해도 좋아요. 핵심은 ‘시작’입니다.
          </Text>
        </View>
      </View>
    );
  }

  if (mode === "done") {
    return (
      <View style={{ flex:1, backgroundColor: UI.bg, padding:20, alignItems:"center", justifyContent:"center" }}>
        <Text style={{ fontSize:20, fontWeight:"900", color: UI.text }}>잘했어요! 🎉</Text>
      </View>
    );
  }

  // plan 모드
  return (
    <View style={{ flex:1, backgroundColor: UI.bg }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal:20, paddingTop:18 }}>
        <Text style={{ fontSize:20, fontWeight:"900", color: UI.text, textAlign:"center" }}>스몰 플랜 (≤ 90초)</Text>
        <Text style={{ fontSize:13, color: UI.sub, textAlign:"center", marginTop:6 }}>아주 작은 계획으로 바로 시작하기</Text>
        <View style={{ flexDirection:"row", justifyContent:"center", gap:8, marginTop:10 }}>
          {[0,1,2].map(i=>(
            <View key={i} style={{
              width:8, height:8, borderRadius:4,
              backgroundColor: i <= step ? UI.primary : "#D1D5DB",
              opacity: i===step ? 1 : 0.6, marginHorizontal:4
            }}/>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding:20, gap:14 }}>
        {/* STEP 0 */}
        {step===0 && (
          <Animated.View style={{
            transform:[{ scale:pulse }], backgroundColor: UI.card, borderWidth:1, borderColor: UI.border,
            borderRadius:16, padding:16
          }}>
            <Text style={{ fontSize:16, fontWeight:"900", color: UI.text }}>무엇을 할까요? (2~20자)</Text>
            <TextInput
              value={task}
              onChangeText={setTask}
              maxLength={20}
              placeholder="예) 메일 1통 보내기"
              style={{
                marginTop:10, borderWidth:1, borderColor: UI.border, borderRadius:10,
                backgroundColor:"#fff", paddingHorizontal:12, paddingVertical:10, color: UI.text
              }}
            />
            <View style={{ flexDirection:"row", flexWrap:"wrap", marginTop:10 }}>
              {chipsTask.map(c=>(
                <Chip key={c} label={c} onPress={()=>setTask(c)} active={task===c}/>
              ))}
            </View>
            <Text style={{ color: UI.sub, marginTop:8 }}>힌트: 끝내지 못해도 **시작**이 목표.</Text>
          </Animated.View>
        )}

        {/* STEP 1 */}
        {step===1 && (
          <Animated.View style={{
            transform:[{ scale:pulse }], backgroundColor: UI.card, borderWidth:1, borderColor: UI.border,
            borderRadius:16, padding:16, gap:10
          }}>
            <Text style={{ fontSize:16, fontWeight:"900", color: UI.text }}>어디서 할까요?</Text>
            <View style={{ flexDirection:"row", flexWrap:"wrap" }}>
              {chipsPlace.map(c=>(
                <Chip key={c} label={c} onPress={()=>setPlace(c)} active={place===c}/>
              ))}
            </View>

            <Text style={{ fontSize:16, fontWeight:"900", color: UI.text, marginTop:6 }}>몇 분만 해볼까요?</Text>
            <View style={{ flexDirection:"row", flexWrap:"wrap" }}>
              {chipsTime.map(c=>{
                const m = parseInt(c);
                const active = minutes===m;
                return <Chip key={c} label={c} onPress={()=>setMinutes(m)} active={active}/>;
              })}
            </View>

            <Text style={{ fontSize:16, fontWeight:"900", color: UI.text, marginTop:6 }}>언제 시작?</Text>
            <View style={{ flexDirection:"row" }}>
              <Chip label="지금" onPress={()=>setStartWhen("지금")} active={startWhen==="지금"}/>
              <Chip label="끝나고" onPress={()=>setStartWhen("끝나고")} active={startWhen==="끝나고"}/>
            </View>

            <Text style={{ fontSize:14, color: UI.sub, marginTop:4 }}>
              팁: 3~10분 추천. ‘끝나고’는 바로 이어서 시작 알림을 의식적으로 떠올리기.
            </Text>
          </Animated.View>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <Animated.View style={{
            transform:[{ scale:pulse }], backgroundColor: UI.card, borderWidth:1, borderColor: UI.border,
            borderRadius:16, padding:16, gap:10
          }}>
            <Text style={{ fontSize:16, fontWeight:"900", color: UI.text }}>걸림돌이 있다면 한 줄로</Text>
            <TextInput
              value={barrier}
              onChangeText={setBarrier}
              placeholder="예) 휴대폰 알림, 자리 시끄러움"
              style={{
                marginTop:8, borderWidth:1, borderColor: UI.border, borderRadius:10,
                backgroundColor:"#fff", paddingHorizontal:12, paddingVertical:10, color: UI.text
              }}
            />
            <View style={{
              marginTop:10, padding:12, borderRadius:12, backgroundColor:"#F1F5F9",
              borderWidth:1, borderColor: UI.border
            }}>
              <Text style={{ color: UI.sub, marginBottom:6 }}>최종 확인</Text>
              <Text style={{ color: UI.text, fontWeight:"900" }}>{summary}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={{ padding:20, paddingTop:0 }}>
        <TouchableOpacity
          onPress={pressNext}
          disabled={(step===0 && !canNext0) || (step===1 && !canNext1)}
          style={{
            height:52, borderRadius:14, alignItems:"center", justifyContent:"center",
            backgroundColor: (step===0 && !canNext0) || (step===1 && !canNext1) ? "#9CA3AF" : UI.primary
          }}
        >
          <Text style={{ color:"#fff", fontWeight:"900", fontSize:16 }}>
            {step===2 ? "시작하기(알림 + 카운트다운)" : "다음"}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize:12, color: UI.sub, textAlign:"center", marginTop:8 }}>
          설정한 분 만큼 알림과 함께 카운트다운이 진행돼요.
        </Text>
      </View>
    </View>
  );
}
