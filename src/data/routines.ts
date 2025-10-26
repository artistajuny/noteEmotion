// app/data/routines.ts

/**
 * 태그(대분류)
 * - positive : 기쁨/여유/설렘 계열
 * - tense    : 불안/짜증/분노 계열
 * - low      : 슬픔/무기력/피곤 계열
 * - neutral  : 중립/무관
 *
 * NOTE:
 * - 기존 emotions(소분류 enum)은 내부 호환용으로만 둠(optional).
 * - 실제 필터/노출은 tags 기준으로만 사용.
 */

export type TagCluster = "positive" | "tense" | "low" | "neutral";

export type EmotionType =
  | "happy" | "calm" | "grateful" | "angry" | "sad" | "anxious" | "stressed" | "tired" | "neutral";

export type Routine = {
  // 메타
  code?: string;           // DB/라우팅 식별자(옵션)
  title: string;
  category: string;
  premium?: boolean;

  // 접근성
  unlockLevel: number;     // 0,5,10,15,20...
  unlockPoints: number;    // 0,100,200,300,400

  // 노출/추천
  tags: TagCluster[];      // ✅ 필터 기준
  emotions?: EmotionType[]; // 호환용(참조만)
};

// 감정→태그 매핑(내부 변환용)
const emo2tag = (e: EmotionType): TagCluster => {
  switch (e) {
    case "happy":
    case "calm":
      return "positive";
    case "anxious":
    case "stressed":
    case "angry":
      return "tense";
    case "sad":
    case "tired":
      return "low";
    case "neutral":
    case "grateful": // 감사는 노출 중립으로 처리
    default:
      return "neutral";
  }
};

// emotions → tags 변환 유틸
const toTags = (emotions?: EmotionType[]): TagCluster[] => {
  if (!emotions || emotions.length === 0) return ["neutral"];
  const set = new Set<TagCluster>(emotions.map(emo2tag));
  return Array.from(set);
};

// BASE 정의(이전 emotions 유지) → tags로 변환해 export
type BaseRoutine = Omit<Routine, "tags">;

const BASE: BaseRoutine[] = [
  // ===== Lv0 =====
  {
    code: "routine3_54321",
    title: "5-4-3-2-1 감각 인지",
    category: "호흡/바디",
    emotions: ["anxious","stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: true,
  },
  {
    code: "routine4_478_breathing",
    title: "4-7-8 호흡법",
    category: "호흡/바디",
    emotions: ["anxious","stressed","tired","neutral"],
    unlockLevel: 0,
    unlockPoints: 150,
    premium: false,
  },
  {
    code: "routine_body_scan",
    title: "짧은 바디스캔",
    category: "호흡/바디",
    emotions: ["calm","tired","stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "pmr-rapid-release",
    title: "점진적 근육 이완",
    category: "호흡/바디",
    emotions: ["anxious","angry","stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "stretch_1min",
    title: "1분 스트레칭(목·어깨)",
    category: "호흡/바디",
    emotions: ["tired", "stressed", "neutral"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "hand_massage",
    title: "핸드 리뉴얼 (손 마사지)",
    category: "호흡/바디",
    emotions: ["tired", "anxious", "stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: true,
  },
   {
    code: "move_1min",                       // DB: 'move_1min'
    title: "제자리 움직임 1분",                 // DB 동일
    category: "행동 유도",
    emotions: ["tired", "stressed", "sad"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "drink_water",
    title: "물 한 잔 마시기",   // ✅ routine.sql 제목과 완전 동일
    category: "행동 유도",
    emotions: ["neutral","tired","stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "mini_hydrate",
    title: "미니 수분 루틴",
    category: "행동 유도",
    emotions: ["neutral","tired","stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "small_plan",
    title: "스몰 플랜",
    category: "기록/스토리텔링",
    emotions: ["neutral","tired","stressed"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false,
  },
  {
    code: "affirmation_basic",
    title: "1분 긍정 확언",
    category: "자기대화/확언",
    emotions: ["happy","tired","neutral","sad"],
    unlockLevel: 0,
    unlockPoints: 0,
    premium: false
    },
  { 
    code: "self_care", 
    title: "오늘 수고 인정하기", 
    category: "자기대화/확언", 
    emotions: ["sad","grateful","tired"], 
    unlockLevel: 0, 
    unlockPoints: 0,
    premium: false,
  },
  { 
    code: "strengths3" , 
    title: "나의 강점 3가지", 
    category: "자기대화/확언", 
    emotions: ["happy","neutral","sad"], 
    unlockLevel: 0, 
    unlockPoints: 0,
    premium: false,
  },

  // ===== Lv5 =====
  { title: "교대 호흡(좌우 코)", category: "호흡/바디", emotions: ["calm","anxious","tired"], unlockLevel: 5, unlockPoints: 100 },
  { title: "자기 격려", category: "자기대화/확언", emotions: ["sad","grateful","tired"], unlockLevel: 5, unlockPoints: 100 },
  { title: "문장 완성(나는_/원하는 건_/할 수 있는 건_)", category: "자기대화/확언", emotions: ["sad","calm","neutral"], unlockLevel: 5, unlockPoints: 100 },
  { title: "미니 감사(3가지)", category: "회상/감사", emotions: ["happy","grateful","neutral","sad"], unlockLevel: 5, unlockPoints: 100 },
  { title: "미래 자기 대화", category: "회상/감사", emotions: ["happy","sad","neutral"], unlockLevel: 5, unlockPoints: 100 },
  { title: "마이크로 스토리", category: "기록/스토리텔링", emotions: ["happy","sad","calm","neutral"], unlockLevel: 5, unlockPoints: 100 },
  { title: "반전 프레임(친구라면?)", category: "자기대화/확언", emotions: ["angry","stressed","sad"], unlockLevel: 5, unlockPoints: 100 },
  { title: "감정 디톡스(적고 비우기)", category: "정화/거리두기", emotions: ["angry","stressed"], unlockLevel: 5, unlockPoints: 100 },
  { title: "감정 거리두기(풍선 날리기)", category: "정화/거리두기", emotions: ["angry","stressed"], unlockLevel: 5, unlockPoints: 100 },
  { title: "좋은 기억 떠올리기", category: "회상/감사", emotions: ["happy","sad","neutral"], unlockLevel: 5, unlockPoints: 100 },

  // ===== Lv10 =====
  { title: "문제 쪼개기(3단계)", category: "정화/거리두기", emotions: ["stressed","anxious","angry"], unlockLevel: 10, unlockPoints: 200 },
  { title: "걱정 상자 닫기", category: "정화/거리두기", emotions: ["anxious","stressed"], unlockLevel: 10, unlockPoints: 200 },
  { title: "잡념 스와이프", category: "정화/거리두기", emotions: ["stressed","anxious"], unlockLevel: 10, unlockPoints: 200 },
  { title: "감정 앵커링", category: "회상/감사", emotions: ["calm","sad","tired","neutral"], unlockLevel: 10, unlockPoints: 200 },
  { title: "오늘 배운 것 1가지", category: "회상/감사", emotions: ["happy","stressed","neutral"], unlockLevel: 10, unlockPoints: 200 },
  { title: "짧은 편지(과거/미래의 나에게)", category: "회상/감사", emotions: ["sad","calm","tired","neutral"], unlockLevel: 10, unlockPoints: 200 },
  { title: "감정 단어 콜라주", category: "기록/스토리텔링", emotions: ["happy","anxious","neutral","sad"], unlockLevel: 10, unlockPoints: 200 },
  { title: "즉흥 낙서/스케치", category: "기록/스토리텔링", emotions: ["happy","anxious"], unlockLevel: 10, unlockPoints: 200 },
  { title: "만약 ___라면? 가정 질문", category: "자기대화/확언", emotions: ["anxious","calm","neutral"], unlockLevel: 10, unlockPoints: 200 },
  { title: "오늘 가장 빛난 순간", category: "회상/감사", emotions: ["happy","neutral","grateful"], unlockLevel: 10, unlockPoints: 200 },

  // ===== Lv15 =====
  { title: "하루 키워드 3개", category: "기록/스토리텔링", emotions: ["happy","neutral","calm"], unlockLevel: 15, unlockPoints: 300 },
  { title: "오늘의 해시태그", category: "기록/스토리텔링", emotions: ["neutral","happy"], unlockLevel: 15, unlockPoints: 300 },
  { title: "나만의 안전한 장소 상상", category: "회상/감사", emotions: ["anxious","stressed","sad"], unlockLevel: 15, unlockPoints: 300 },
  { title: "고마운 사람 이름 적기", category: "사회적 연결", emotions: ["grateful","happy","calm"], unlockLevel: 15, unlockPoints: 300 },
  { title: "내일의 친절 1가지", category: "사회적 연결", emotions: ["grateful","neutral"], unlockLevel: 15, unlockPoints: 300 },
  { title: "부정적 생각 전환(반증 찾기)", category: "자기대화/확언", emotions: ["sad","stressed","anxious"], unlockLevel: 15, unlockPoints: 300 },

  // ===== Lv20 =====
  { title: "제자리 발끝 들기 30회", category: "호흡/바디", emotions: ["tired","neutral","stressed"], unlockLevel: 20, unlockPoints: 400 },
  { title: "손 집중 호흡(손등/손바닥 주의)", category: "호흡/바디", emotions: ["calm","tired","anxious"], unlockLevel: 20, unlockPoints: 400 },
];

export const routines: Routine[] = BASE.map((r) => ({
  ...r,
  tags: toTags(r.emotions),
}));
