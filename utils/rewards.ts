// utils/rewards.ts
export type Kind = "guided" | "custom";

const CUSTOM_CODES = new Set([
  "affirmation_basic",
  "strengths3",
  "self_ack_today",
  // 필요시 추가
]);

export function getKindByCode(code?: string): Kind {
  return code && CUSTOM_CODES.has(code) ? "custom" : "guided";
}

export function calcSingleReward(opts: {
  isPremium: boolean;
  kind: Kind;
  durationSec?: number;
  emotionImproved?: boolean;
}) {
  const { isPremium, kind } = opts;
  const base =
    isPremium && kind === "custom" ? { xp: 28, pt: 8 } :
    isPremium && kind === "guided" ? { xp: 18, pt: 5 } :
    !isPremium && kind === "custom" ? { xp: 22, pt: 6 } :
                                      { xp: 12, pt: 3 };

  const dur = Math.max(0, Math.floor((opts.durationSec ?? 0) / 60)) * 4; // 분당 +4XP
  const mood = opts.emotionImproved ? 8 : 0;

  // 10초 미만 체류는 보상 0
  const tooShort = (opts.durationSec ?? 0) > 0 && (opts.durationSec as number) < 10;
  const xp = tooShort ? 0 : base.xp + dur + mood;
  const points = tooShort ? 0 : base.pt;

  return { xp, points };
}
