// app/home.tsx
import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Alert, FlatList } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/store/auth";

/**
 * 홈: 헤더/인사 → 빠른 액션 → 추천 루틴 → 주간 스냅샷 → 프로모/업셀
 * - 게스트: 실행은 가능(체험) / 저장·즐겨찾기·카드공유는 가입 유도(소프트월)
 * - 로그인: 전체 기능 활성
 */
export default function HomeScreen() {
  const { email } = useAuth();
  const isGuest = !email;

  // ▼ 더미 데이터(후에 API 연동/쿼리로 대체)
  const todayStr = useMemo(() => {
    const d = new Date();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const dd = `${d.getDate()}`.padStart(2, "0");
    return `${m}.${dd}`;
  }, []);
  const recommended = useMemo(
    () => [
      { id: "r1", title: "5-4-3-2-1 감각 인지", minutes: 3, premium: true },
      { id: "r2", title: "1분 긍정 확언", minutes: 1, premium: false },
      { id: "r3", title: "호흡 4-7-8", minutes: 2, premium: false },
    ],
    []
  );

  // ▼ 소프트월(게스트) 처리
  const softWall = (reason: string, onProceed?: () => void) => {
    if (!isGuest) return onProceed?.();
    Alert.alert(
      "기록을 저장하려면 로그인",
      `${reason}\n이어서 사용하시려면 가입/로그인 해주세요.`,
      [
        { text: "나중에", style: "cancel" },
        {
          text: "지금 가입",
          onPress: () => router.replace("/(onboarding)/step1-welcome"),
        },
      ]
    );
  };

  // ▼ 빠른 액션
  const onQuickEmotion = () => {
    // 게스트: 체험 모달 열었다고 가정(여기선 간단 안내)
    if (isGuest) {
      Alert.alert("체험 모드", "간단 감정 기록(인메모리) 진행!", [{ text: "확인" }]);
      return;
    }
    // 로그인: 실제 기록 화면(추후 라우트 교체)
    router.push("/routines"); // 임시: 감정기록 라우트 준비되면 교체
  };

  const onQuickRoutine = () => {
    // 바로 최근 루틴 실행(임시: 루틴 탭으로 이동)
    router.push("/(tabs)/routines");
  };

  const onOpenMarket = () => {
    router.push("/(tabs)/market");
  };

  // ▼ 추천 루틴 클릭
  const onPressRoutine = (item: { id: string; premium: boolean }) => {
    if (item.premium) {
      // 프리미엄은 소유권/로그인 필요 → 소프트월
      return softWall("프리미엄 루틴은 계정이 필요해요.", () => {
        // 로그인 유저면 상세로
        router.push(`/(tabs)/routines`);
      });
    }
    // 무료 루틴: 누구나 실행(게스트는 인메모리 실행로직, 로그인은 기록)
    router.push(`/(tabs)/routines`);
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      {/* 헤더 */}
      <HomeHeader name={email ?? "게스트"} dateLabel={todayStr} isGuest={isGuest} />

      {/* 빠른 액션 */}
      <QuickActions
        onQuickEmotion={onQuickEmotion}
        onQuickRoutine={onQuickRoutine}
        onOpenMarket={onOpenMarket}
      />

      {/* 추천 루틴(게스트도 노출 / 프리미엄은 소프트월) */}
      <SectionTitle title="추천 루틴" />
      <FlatList
        data={recommended}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 8 }}
        renderItem={({ item }) => (
          <RoutineCard
            title={item.title}
            minutes={item.minutes}
            premium={item.premium}
            onPress={() => onPressRoutine(item)}
          />
        )}
      />

      {/* 주간 스냅샷(간략 프리뷰) */}
      <SectionTitle title="이번 주 스냅샷" />
      <WeeklySnapshot isGuest={isGuest} onNeedLogin={() => softWall("리포트를 저장/조회하려면 로그인해주세요.")} />

      {/* 프로모/업셀 */}
      <PromoBanner
        isGuest={isGuest}
        onPress={() =>
          isGuest
            ? softWall("루틴 카드 공유는 로그인 후 이용할 수 있어요.")
            : Alert.alert("안내", "완료 카드 만들기 화면으로 이동(추후 구현)")
        }
      />
    </View>
  );
}

/* ========== UI 컴포넌트(간단 스켈레톤) ========== */

function HomeHeader({ name, dateLabel, isGuest }: { name: string; dateLabel: string; isGuest: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, color: "#666" }}>{dateLabel}</Text>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        안녕하세요, <Text style={{ color: "#6b7cff" }}>{name}</Text> 님
      </Text>
      <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: "#f1f3ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
        <Text style={{ color: "#3a46d3", fontWeight: "700" }}>{isGuest ? "지금 기분은?" : "오늘 기분 기록하셨나요?"}</Text>
      </View>
    </View>
  );
}

function QuickActions({
  onQuickEmotion,
  onQuickRoutine,
  onOpenMarket,
}: {
  onQuickEmotion: () => void;
  onQuickRoutine: () => void;
  onOpenMarket: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <CTA label="감정 기록하기" onPress={onQuickEmotion} />
      <CTA label="빠른 루틴 시작" onPress={onQuickRoutine} />
      <CTA label="루틴팩 둘러보기" onPress={onOpenMarket} />
    </View>
  );
}

function CTA({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: "#111",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={{ fontSize: 16, fontWeight: "800", marginTop: 4 }}>{title}</Text>;
}

function RoutineCard({
  title,
  minutes,
  premium,
  onPress,
}: {
  title: string;
  minutes: number;
  premium?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 180,
        backgroundColor: "#f7f7f9",
        borderRadius: 14,
        padding: 14,
        gap: 6,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "800" }} numberOfLines={1}>
        {title}
      </Text>
      <Text style={{ fontSize: 12, color: "#666" }}>{minutes}분</Text>
      {premium ? (
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#ffe8ef",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 11, color: "#c2185b", fontWeight: "700" }}>프리미엄</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function WeeklySnapshot({ isGuest, onNeedLogin }: { isGuest: boolean; onNeedLogin: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const onPress = () => {
    if (isGuest) return onNeedLogin();
    setExpanded((p) => !p);
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: "#fafafa",
        borderRadius: 12,
        padding: 14,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "700" }}>감정/루틴 요약</Text>
      <Text style={{ fontSize: 12, color: "#666" }}>
        이번 주 완료 루틴 0회 · 평균 감정지수 — {/* 연동 전 플레이스홀더 */}
      </Text>
      {!isGuest && expanded && (
        <View style={{ backgroundColor: "#eee", borderRadius: 8, padding: 10 }}>
          <Text style={{ fontSize: 12, color: "#333" }}>세부 리포트(차트 자리)</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function PromoBanner({ isGuest, onPress }: { isGuest: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginTop: 6,
        backgroundColor: isGuest ? "#fff4e5" : "#e7f5ff",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "800", marginBottom: 4 }}>
        {isGuest ? "완료 카드 만들고 공유해보기" : "이번 주 루틴 카드 만들기"}
      </Text>
      <Text style={{ fontSize: 12, color: "#666" }}>
        {isGuest ? "로그인하면 완료 카드를 저장·공유할 수 있어요." : "완료한 루틴으로 카드 이미지를 만들어보세요."}
      </Text>
    </TouchableOpacity>
  );
}
