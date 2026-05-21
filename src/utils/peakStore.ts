import type { ScoreResult } from "./calculateScore";
import type { HandType, WinMethod } from "./scoringRules";

const STORAGE_KEY = "changchun-mahjong-peak-store-v1";

export interface RoundCalculatorSnapshot {
  handType: HandType;
  winMethod: WinMethod;
  scoreResult: ScoreResult;
  selectedOptionId: string | null;
  selectedOptionLabel: string | null;
  huScore: number;
  selfGangScore: number;
  otherGangScore: number;
  selfGangResult: number;
  otherGangResult: number;
  gangScore: number;
  roundTotalScore: number;
}

export interface RoundRecord {
  id: string;
  roundNo: number;
  createdAt: string;
  status: "normal" | "void" | "manual";
  snapshot: RoundCalculatorSnapshot;
}

export interface PeakRecord {
  id: string;
  createdAt: string;
  dateKey: string;
  dayPeakNo: number;
  status: "active" | "completed";
  rounds: RoundRecord[];
}

export interface PeakStoreData {
  peaks: PeakRecord[];
  activePeakId: string | null;
}

export function createEmptyPeakStore(): PeakStoreData {
  return {
    peaks: [],
    activePeakId: null,
  };
}

function nowAtSecondISO(): string {
  const now = new Date();
  now.setMilliseconds(0);
  return now.toISOString();
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function loadPeakStore(): PeakStoreData {
  if (typeof window === "undefined") {
    return createEmptyPeakStore();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyPeakStore();
  }

  try {
    const parsed = JSON.parse(raw) as PeakStoreData;
    if (!parsed || !Array.isArray(parsed.peaks)) {
      return createEmptyPeakStore();
    }

    return {
      peaks: parsed.peaks,
      activePeakId: parsed.activePeakId ?? null,
    };
  } catch {
    return createEmptyPeakStore();
  }
}

export function persistPeakStore(data: PeakStoreData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActivePeak(data: PeakStoreData): PeakRecord | null {
  if (!data.activePeakId) {
    return null;
  }

  const matched = data.peaks.find((peak) => peak.id === data.activePeakId && peak.status === "active");
  return matched ?? null;
}

export function startNewPeak(data: PeakStoreData): PeakStoreData {
  const now = new Date();
  const createdAt = nowAtSecondISO();
  const dateKey = toDateKey(now);
  const dayPeakNo = data.peaks.filter((peak) => peak.dateKey === dateKey).length + 1;
  const id = `${dateKey}-peak-${dayPeakNo}`;

  const nextPeak: PeakRecord = {
    id,
    createdAt,
    dateKey,
    dayPeakNo,
    status: "active",
    rounds: [],
  };

  return {
    peaks: [...data.peaks, nextPeak],
    activePeakId: nextPeak.id,
  };
}

export function addRoundToActivePeak(data: PeakStoreData, snapshot: RoundCalculatorSnapshot): PeakStoreData {
  const activePeak = getActivePeak(data);
  if (!activePeak) {
    return data;
  }

  const nextRoundNo = activePeak.rounds.length + 1;
  const roundRecord: RoundRecord = {
    id: `${activePeak.id}-round-${nextRoundNo}`,
    roundNo: nextRoundNo,
    createdAt: nowAtSecondISO(),
    status: "normal",
    snapshot,
  };

  return {
    ...data,
    peaks: data.peaks.map((peak) =>
      peak.id === activePeak.id ? { ...peak, rounds: [...peak.rounds, roundRecord] } : peak,
    ),
  };
}

export function completePeak(data: PeakStoreData, peakId: string): PeakStoreData {
  const hasTarget = data.peaks.some((peak) => peak.id === peakId);
  if (!hasTarget) {
    return data;
  }

  return {
    peaks: data.peaks.map((peak) => (peak.id === peakId ? { ...peak, status: "completed" } : peak)),
    activePeakId: data.activePeakId === peakId ? null : data.activePeakId,
  };
}

export function amendLatestRound(
  data: PeakStoreData,
  peakId: string,
  huScore: number,
  gangScore: number,
): PeakStoreData {
  const peak = data.peaks.find((item) => item.id === peakId);
  if (!peak || peak.rounds.length === 0 || peak.status !== "active") {
    return data;
  }

  const latestRound = [...peak.rounds].sort((a, b) => b.roundNo - a.roundNo)[0];
  const nextRoundNo = peak.rounds.reduce((maxNo, round) => Math.max(maxNo, round.roundNo), 0) + 1;
  const nextRound: RoundRecord = {
    id: `${peak.id}-round-${nextRoundNo}`,
    roundNo: nextRoundNo,
    createdAt: nowAtSecondISO(),
    status: "manual",
    snapshot: {
      ...latestRound.snapshot,
      selectedOptionId: null,
      selectedOptionLabel: "手动修改",
      huScore,
      gangScore,
      roundTotalScore: huScore + gangScore,
      selfGangScore: 0,
      otherGangScore: 0,
      selfGangResult: 0,
      otherGangResult: 0,
    },
  };

  return {
    ...data,
    peaks: data.peaks.map((item) => {
      if (item.id !== peak.id) {
        return item;
      }

      return {
        ...item,
        rounds: item.rounds
          .map((round) => (round.id === latestRound.id ? { ...round, status: "void" as const } : round))
          .concat(nextRound),
      };
    }),
  };
}
