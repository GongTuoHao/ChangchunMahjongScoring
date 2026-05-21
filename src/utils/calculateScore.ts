import { scoreRuleMatrix, type HandType, type WinMethod } from "./scoringRules";

export interface ScoreInput {
  readonly handType: HandType;
  readonly winMethod: WinMethod;
}

export interface ScoreResult {
  readonly normalScores: readonly number[];
  readonly blackCannonScore: number | null;
  readonly totalScore: number;
  readonly hasBlackCannon: boolean;
}

function parseScores(score: string): number[] {
  return score
    .split("/")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const ruleEntry = scoreRuleMatrix[input.handType][input.winMethod];
  const normalScores = parseScores(ruleEntry.normal);
  const blackCannonScore = ruleEntry.blackCannon ? Number(ruleEntry.blackCannon) : null;
  const totalScore =
    blackCannonScore !== null ? blackCannonScore : normalScores.reduce((sum, score) => sum + score, 0);

  return {
    normalScores,
    blackCannonScore,
    totalScore,
    hasBlackCannon: blackCannonScore !== null,
  };
}
