<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { ScoreResult } from "../utils/calculateScore";

const props = defineProps<{
  result: ScoreResult | null;
  errorMessage: string | null;
}>();

interface ScoreOptionItem {
  readonly id: string;
  readonly label: string;
  readonly kind: "score" | "black" | "winner" | "runner";
  readonly scoreValue: number;
  readonly disabled?: boolean;
}

const selectedOptionId = ref<string>("");
const selfGangScore = ref<number>(0);
const otherGangTotalScore = ref<number>(0);
const selfGangPickerRef = ref<HTMLDivElement | null>(null);
const otherGangPickerRef = ref<HTMLDivElement | null>(null);

const GANG_MIN = 0;
const GANG_MAX = 100;
const PICKER_ITEM_HEIGHT = 30;
const PICKER_VISIBLE_COUNT = 3;
const PICKER_PADDING_HEIGHT = ((PICKER_VISIBLE_COUNT - 1) / 2) * PICKER_ITEM_HEIGHT;
const gangScoreValues = Array.from({ length: GANG_MAX - GANG_MIN + 1 }, (_, index) => GANG_MIN + index);

const normalScoreOptions = computed<ScoreOptionItem[]>(() => {
  if (!props.result) {
    return [];
  }

  return props.result.normalScores.map((score, index) => ({
    id: `normal-${index}`,
    label: String(score),
    kind: "score" as const,
    scoreValue: score,
  }));
});

const roleOptions = computed<ScoreOptionItem[]>(() => {
  const hasBlackCannon = props.result?.hasBlackCannon ?? false;
  const blackCannonScore = props.result?.blackCannonScore ?? 0;
  return [
    {
      id: "winner",
      label: "赢家",
      kind: "winner" as const,
      scoreValue: props.result?.totalScore ?? 0,
    },
    {
      id: "black-cannon",
      label: "黑炮",
      kind: "black" as const,
      scoreValue: blackCannonScore,
      disabled: !hasBlackCannon,
    },
    {
      id: "runner",
      label: "陪跑",
      kind: "runner" as const,
      scoreValue: 0,
      disabled: !hasBlackCannon,
    },
  ];
});

const scoreOptions = computed<ScoreOptionItem[]>(() => {
  return [...normalScoreOptions.value, ...roleOptions.value];
});

const selectedOption = computed<ScoreOptionItem | null>(() => {
  if (!selectedOptionId.value) {
    return null;
  }

  return scoreOptions.value.find((option) => option.id === selectedOptionId.value) ?? null;
});

watch(
  () => props.result,
  () => {
    selectedOptionId.value = "";
  },
);

watch(
  () => props.result?.hasBlackCannon,
  (hasBlackCannon) => {
    if (!hasBlackCannon && (selectedOption.value?.kind === "runner" || selectedOption.value?.kind === "black")) {
      selectedOptionId.value = "";
    }
  },
);

const recordResult = computed<number>(() => {
  if (!props.result) {
    return 0;
  }

  if (!selectedOption.value) {
    return 0;
  }

  if (selectedOption.value.kind === "winner") {
    return selectedOption.value.scoreValue;
  }

  if (selectedOption.value.kind === "runner") {
    return 0;
  }

  return -selectedOption.value.scoreValue;
});

const recordResultClass = computed<string>(() => {
  if (recordResult.value > 0) {
    return "text-emerald-700";
  }

  if (recordResult.value < 0) {
    return "text-[var(--error-color)]";
  }

  return "text-slate-600";
});

function toSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

const selfGangResult = computed<number>(() => toSafeNumber(selfGangScore.value) * 3);
const otherGangResult = computed<number>(() => toSafeNumber(otherGangTotalScore.value) * -1);
const gangRecordResult = computed<number>(() => selfGangResult.value + otherGangResult.value);
const roundTotalScore = computed<number>(() => recordResult.value + gangRecordResult.value);

const gangRecordResultClass = computed<string>(() => {
  if (gangRecordResult.value > 0) {
    return "text-emerald-700";
  }

  if (gangRecordResult.value < 0) {
    return "text-[var(--error-color)]";
  }

  return "text-slate-600";
});

const roundTotalScoreClass = computed<string>(() => {
  if (roundTotalScore.value > 0) {
    return "text-emerald-700";
  }

  if (roundTotalScore.value < 0) {
    return "text-[var(--error-color)]";
  }

  return "text-slate-600";
});

function clampGangValue(value: number): number {
  return Math.min(GANG_MAX, Math.max(GANG_MIN, value));
}

function syncPickerScroll(pickerRef: HTMLDivElement | null, value: number): void {
  if (!pickerRef) {
    return;
  }

  pickerRef.scrollTop = value * PICKER_ITEM_HEIGHT;
}

function setSelfGangScore(value: number): void {
  selfGangScore.value = clampGangValue(value);
}

function setOtherGangScore(value: number): void {
  otherGangTotalScore.value = clampGangValue(value);
}

function onGangPickerScroll(type: "self" | "other", event: Event): void {
  const target = event.target as HTMLDivElement;
  const nextValue = clampGangValue(Math.round(target.scrollTop / PICKER_ITEM_HEIGHT));

  if (type === "self" && nextValue !== selfGangScore.value) {
    selfGangScore.value = nextValue;
  }

  if (type === "other" && nextValue !== otherGangTotalScore.value) {
    otherGangTotalScore.value = nextValue;
  }
}

onMounted(() => {
  nextTick(() => {
    syncPickerScroll(selfGangPickerRef.value, selfGangScore.value);
    syncPickerScroll(otherGangPickerRef.value, otherGangTotalScore.value);
  });
});

watch(selfGangScore, (value) => {
  syncPickerScroll(selfGangPickerRef.value, value);
});

watch(otherGangTotalScore, (value) => {
  syncPickerScroll(otherGangPickerRef.value, value);
});
</script>

<template>
  <section class="rounded-[4px] bg-[var(--bg-card-bottom)] p-4 shadow-[var(--box-shadow)]">
    <div
      class="rounded-[4px] border border-[#E0E0E0] bg-[var(--bg-content)] p-4"
    >
      <p v-if="errorMessage" class="text-base leading-5 text-[var(--error-color)]">
        {{ errorMessage }}
      </p>
      <div v-else-if="result" class="w-full">
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-9 rounded border border-slate-300 bg-white p-2">
            <div class="grid grid-cols-3 gap-2">
              <label
                v-for="option in normalScoreOptions"
                :key="option.id"
                class="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <input
                  v-model="selectedOptionId"
                  :value="option.id"
                  class="h-4 w-4 accent-[var(--primary-color)]"
                  name="score-choice"
                  type="radio"
                />
                <span class="text-slate-700">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div class="col-span-3 row-span-2 flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-50 px-2 py-2 text-sm">
            <span class="text-slate-600">胡牌</span>
            <span :class="['mt-1 text-2xl font-bold', recordResultClass]">{{ recordResult }}</span>
          </div>

          <div class="col-span-9 rounded border border-slate-300 bg-white p-2">
            <div class="grid grid-cols-3 gap-2">
              <label
                v-for="option in roleOptions"
                :key="option.id"
                :class="[
                  'inline-flex w-full items-center justify-center gap-1 rounded border px-2 py-1 text-sm',
                  option.disabled
                    ? 'cursor-not-allowed border-slate-200 text-slate-400'
                    : 'cursor-pointer border-slate-300',
                ]"
              >
                <input
                  v-model="selectedOptionId"
                  :disabled="option.disabled"
                  :value="option.id"
                  class="h-4 w-4 accent-[var(--primary-color)] disabled:cursor-not-allowed"
                  name="score-choice"
                  type="radio"
                />
                <span
                  class="whitespace-nowrap"
                  :class="
                    option.kind === 'black'
                      ? option.disabled
                        ? 'text-slate-400'
                        : 'font-semibold text-[var(--error-color)]'
                      : option.disabled
                        ? 'text-slate-400'
                        : 'text-slate-700'
                  "
                >
                  {{ option.label }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-12 gap-2">
          <div class="col-span-9 grid grid-cols-2 gap-2">
            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-slate-600">内杠</span>
                <span class="inline-flex items-center text-xs leading-none text-emerald-600">*3</span>
              </div>
              <div class="picker-wrap">
                <div class="picker-highlight"></div>
                <div
                  ref="selfGangPickerRef"
                  class="picker-scroll"
                  @scroll.passive="onGangPickerScroll('self', $event)"
                >
                  <div :style="{ height: `${PICKER_PADDING_HEIGHT}px` }"></div>
                  <button
                    v-for="value in gangScoreValues"
                    :key="`self-${value}`"
                    class="picker-item"
                    type="button"
                    @click="setSelfGangScore(value)"
                  >
                    <span :class="value === selfGangScore ? 'picker-item-active' : 'picker-item-text'">{{ value }}</span>
                  </button>
                  <div :style="{ height: `${PICKER_PADDING_HEIGHT}px` }"></div>
                </div>
              </div>
            </div>

            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-slate-600">外杠</span>
                <span class="inline-flex items-center text-xs leading-none text-[var(--error-color)]">*(-1)</span>
              </div>
              <div class="picker-wrap">
                <div class="picker-highlight"></div>
                <div
                  ref="otherGangPickerRef"
                  class="picker-scroll"
                  @scroll.passive="onGangPickerScroll('other', $event)"
                >
                  <div :style="{ height: `${PICKER_PADDING_HEIGHT}px` }"></div>
                  <button
                    v-for="value in gangScoreValues"
                    :key="`other-${value}`"
                    class="picker-item"
                    type="button"
                    @click="setOtherGangScore(value)"
                  >
                    <span :class="value === otherGangTotalScore ? 'picker-item-active' : 'picker-item-text'">{{ value }}</span>
                  </button>
                  <div :style="{ height: `${PICKER_PADDING_HEIGHT}px` }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-3 relative flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-50 px-2 py-2 text-sm">
            <span class="text-slate-600">杠牌</span>
            <span :class="['mt-1 text-2xl font-bold', gangRecordResultClass]">{{ gangRecordResult }}</span>
          </div>
        </div>

        <p class="mt-1 whitespace-nowrap text-xs text-slate-500">内杠计3倍正分，外杠计1倍负分</p>

        <div class="mt-3 grid grid-cols-12 gap-2">
          <div class="col-span-9">
            <button
              class="h-full w-full rounded border border-[var(--primary-color)] bg-[var(--primary-color)] px-3 py-2 text-sm font-medium text-white"
              type="button"
            >
              保存本局
            </button>
          </div>
          <div class="col-span-3 flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-50 px-2 py-2 text-sm">
            <span class="text-slate-600">总分</span>
            <span :class="['mt-1 text-2xl font-bold', roundTotalScoreClass]">{{ roundTotalScore }}</span>
          </div>
        </div>
      </div>
      <p v-else class="text-base leading-5 text-[#757575]">请选择上方牌型和胡法</p>
    </div>
  </section>
</template>

<style scoped>
.picker-wrap {
  position: relative;
  height: 90px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
}

.picker-scroll {
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}

.picker-scroll::-webkit-scrollbar {
  display: none;
}

.picker-highlight {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 50%;
  height: 30px;
  transform: translateY(-50%);
  border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  pointer-events: none;
  z-index: 1;
}

.picker-item {
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  scroll-snap-align: center;
  background: transparent;
  border: 0;
  padding: 0;
}

.picker-item-text {
  color: #64748b;
  font-size: 13px;
}

.picker-item-active {
  color: #0f172a;
  font-weight: 700;
  font-size: 14px;
}
</style>
