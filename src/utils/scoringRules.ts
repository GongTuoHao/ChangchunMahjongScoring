export const HAND_TYPE_OPTIONS = [
  "平胡",
  "站立平/夹",
  "站立夹/飘",
  "站立飘/飘顶/七对",
  "站立飘顶/豪七",
] as const;

export const WIN_METHOD_OPTIONS = [
  "闲点闲",
  "闲自摸",
  "庄点闲",
  "庄自摸",
  "闲点庄",
  "闲摸宝",
  "庄摸宝",
  "闲对宝",
  "庄对宝",
] as const;

export type HandType = (typeof HAND_TYPE_OPTIONS)[number];
export type WinMethod = (typeof WIN_METHOD_OPTIONS)[number];

export interface ScoreRuleEntry {
  readonly normal: string;
  readonly blackCannon?: string;
}

export type ScoreRuleMatrix = Record<HandType, Record<WinMethod, ScoreRuleEntry>>;

export const scoreRuleMatrix: ScoreRuleMatrix = {
  平胡: {
    闲点闲: { normal: "2/2/1", blackCannon: "5" },
    闲自摸: { normal: "4/2/2" },
    庄点闲: { normal: "4/1/1", blackCannon: "6" },
    庄自摸: { normal: "4/4/4" },
    闲点庄: { normal: "4/2/2", blackCannon: "8" },
    闲摸宝: { normal: "8/4/4" },
    庄摸宝: { normal: "8/8/8" },
    闲对宝: { normal: "16/8/8" },
    庄对宝: { normal: "16/16/16" },
  },
  "站立平/夹": {
    闲点闲: { normal: "4/2/2", blackCannon: "8" },
    闲自摸: { normal: "8/4/4" },
    庄点闲: { normal: "8/2/2", blackCannon: "12" },
    庄自摸: { normal: "8/4/4" },
    闲点庄: { normal: "4/4/2", blackCannon: "10" },
    闲摸宝: { normal: "16/8/8" },
    庄摸宝: { normal: "16/16/16" },
    闲对宝: { normal: "32/16/16" },
    庄对宝: { normal: "32/32/32" },
  },
  "站立夹/飘": {
    闲点闲: { normal: "8/8/4", blackCannon: "20" },
    闲自摸: { normal: "16/8/8" },
    庄点闲: { normal: "16/4/4", blackCannon: "24" },
    庄自摸: { normal: "16/16/16" },
    闲点庄: { normal: "16/8/8", blackCannon: "32" },
    闲摸宝: { normal: "32/16/16" },
    庄摸宝: { normal: "32/32/32" },
    闲对宝: { normal: "64/32/32" },
    庄对宝: { normal: "64/64/64" },
  },
  "站立飘/飘顶/七对": {
    闲点闲: { normal: "16/16/8", blackCannon: "40" },
    闲自摸: { normal: "32/16/16" },
    庄点闲: { normal: "32/8/8", blackCannon: "48" },
    庄自摸: { normal: "32/32/32" },
    闲点庄: { normal: "32/16/16", blackCannon: "64" },
    闲摸宝: { normal: "64/32/32" },
    庄摸宝: { normal: "64/64/64" },
    闲对宝: { normal: "128/64/64" },
    庄对宝: { normal: "128/128/128" },
  },
  "站立飘顶/豪七": {
    闲点闲: { normal: "32/32/16", blackCannon: "80" },
    闲自摸: { normal: "64/32/32" },
    庄点闲: { normal: "64/16/16", blackCannon: "96" },
    庄自摸: { normal: "64/64/64" },
    闲点庄: { normal: "64/32/32", blackCannon: "128" },
    闲摸宝: { normal: "128/64/64" },
    庄摸宝: { normal: "128/128/128" },
    闲对宝: { normal: "256/128/128" },
    庄对宝: { normal: "256/256/256" },
  },
};

export function supportsBlackCannon(winMethod: WinMethod): boolean {
  return winMethod === "闲点闲" || winMethod === "庄点闲" || winMethod === "闲点庄";
}
