import { scoreRuleMatrix, type HandType, type WinMethod } from "./scoringRules";

export interface ScoreInput {
  readonly handType: HandType;
  readonly winMethod: WinMethod;
}

export interface ScoreResult {
  readonly scoreText: string;
}

function toPlusExpression(score: string): string {
  return score.split("/").join("+");
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const ruleEntry = scoreRuleMatrix[input.handType][input.winMethod];
  const normalExpression = toPlusExpression(ruleEntry.normal);

  return {
    scoreText: ruleEntry.blackCannon ? `${normalExpression}=${ruleEntry.blackCannon}` : normalExpression,
  };
}
