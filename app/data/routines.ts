// app/data/routines.ts
export type EmotionType =
  | "happy" | "calm" | "grateful" | "angry" | "sad" | "anxious" | "stressed" | "tired" | "neutral";

export type Routine = {
  title: string;
  category: string;
  emotions: EmotionType[];
  unlockLevel: number;   // 0,5,10,15,20...
  unlockPoints: number;  // 레벨 미달 시 대체(0,100,200,300,400)
};

/** 레벨-포인트 규칙: Lv0=0P, Lv5=100P, Lv10=200P, Lv15=300P, Lv20=400P */
export const routines: Routine[] = [
  // ===== Lv0 (즉시 사용: 12개) =====
  { title: "5-4-3-2-1 감각 인지", category: "호흡/바디", emotions: ["anxious","stressed"], unlockLevel: 0, unlockPoints: 0 },
  { title: "호흡 4-7-8", category: "호흡/바디", emotions: ["calm","anxious","angry"], unlockLevel: 0, unlockPoints: 0 },
  { title: "짧은 바디스캔", category: "호흡/바디", emotions: ["calm","tired","stressed"], unlockLevel: 0, unlockPoints: 0 },
  { title: "점진적 근육 이완", category: "호흡/바디", emotions: ["tired","stressed"], unlockLevel: 0, unlockPoints: 0 },
  { title: "1분 스트레칭(목·어깨)", category: "호흡/바디", emotions: ["tired","stressed","neutral"], unlockLevel: 0, unlockPoints: 0 },
  { title: "손 마사지(손가락·손바닥)", category: "호흡/바디", emotions: ["calm","tired","neutral"], unlockLevel: 0, unlockPoints: 0 },
  { title: "제자리 움직임 1분", category: "행동 유도", emotions: ["tired","stressed","sad"], unlockLevel: 0, unlockPoints: 0 },
  { title: "물 한 잔 마시기", category: "행동 유도", emotions: ["calm","tired","neutral","anxious"], unlockLevel: 0, unlockPoints: 0 },
  { title: "스몰 플랜", category: "행동 유도", emotions: ["sad","stressed","anxious","tired"], unlockLevel: 0, unlockPoints: 0 },
  { title: "긍정 확언 따라 읽기", category: "자기대화/확언", emotions: ["happy","tired","neutral","sad"], unlockLevel: 0, unlockPoints: 0 },
  { title: "오늘 수고 인정하기", category: "자기대화/확언", emotions: ["sad","grateful","tired"], unlockLevel: 0, unlockPoints: 0 },
  { title: "나의 강점 3가지", category: "자기대화/확언", emotions: ["happy","neutral","sad"], unlockLevel: 0, unlockPoints: 0 },

  // ===== Lv5 (100P 대체): 10개 =====
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

  // ===== Lv10 (200P 대체): 10개 =====
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

  // ===== Lv15 (300P 대체): 6개 =====
  { title: "하루 키워드 3개", category: "기록/스토리텔링", emotions: ["happy","neutral","calm"], unlockLevel: 15, unlockPoints: 300 },
  { title: "오늘의 해시태그", category: "기록/스토리텔링", emotions: ["neutral","happy"], unlockLevel: 15, unlockPoints: 300 },
  { title: "나만의 안전한 장소 상상", category: "회상/감사", emotions: ["anxious","stressed","sad"], unlockLevel: 15, unlockPoints: 300 },
  { title: "고마운 사람 이름 적기", category: "사회적 연결", emotions: ["grateful","happy","calm"], unlockLevel: 15, unlockPoints: 300 },
  { title: "내일의 친절 1가지", category: "사회적 연결", emotions: ["grateful","neutral"], unlockLevel: 15, unlockPoints: 300 },
  { title: "부정적 생각 전환(반증 찾기)", category: "자기대화/확언", emotions: ["sad","stressed","anxious"], unlockLevel: 15, unlockPoints: 300 },

  // ===== Lv20 (400P 대체): 2개 =====
  { title: "제자리 발끝 들기 30회", category: "호흡/바디", emotions: ["tired","neutral","stressed"], unlockLevel: 20, unlockPoints: 400 },
  { title: "손 집중 호흡(손등/손바닥 주의)", category: "호흡/바디", emotions: ["calm","tired","anxious"], unlockLevel: 20, unlockPoints: 400 }
];
