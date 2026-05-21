<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ScoreResult } from "../utils/calculateScore";
import type { AppMode } from "../utils/appSettings";
import type { RoundCalculatorSnapshot } from "../utils/peakStore";
import type { HandType, WinMethod } from "../utils/scoringRules";

const props = defineProps<{
  result: ScoreResult | null;
  errorMessage: string | null;
  handType: HandType;
  winMethod: WinMethod;
  mode: AppMode;
  resetVersion: number;
}>();

const emit = defineEmits<{
  (event: "save-round", snapshot: RoundCalculatorSnapshot): void;
  (event: "reset-calculator"): void;
}>();

interface ScoreOptionItem {
  readonly id: string;
  readonly label: string;
  readonly kind: "score" | "black" | "winner" | "runner" | "baosanjia";
  readonly scoreValue: number;
  readonly disabled?: boolean;
}

const selectedOptionId = ref<string>("");
const selfGangScore = ref<number>(0);
const otherGangTotalScore = ref<number>(0);
const showToast = ref(false);
const toastMessage = ref("");
const toastKind = ref<"success" | "error">("success");
const selfGangPickerRef = ref<HTMLDivElement | null>(null);
const otherGangPickerRef = ref<HTMLDivElement | null>(null);
let saveToastTimer: number | null = null;

const GANG_MIN = 0;
const GANG_MAX = 100;
const PICKER_ITEM_HEIGHT_REM = 1.875;
const PICKER_VISIBLE_COUNT = 3;
const remBasePx = ref(16);
const gangScoreValues = Array.from({ length: GANG_MAX - GANG_MIN + 1 }, (_, index) => GANG_MIN + index);
const pickerItemHeightPx = computed<number>(() => PICKER_ITEM_HEIGHT_REM * remBasePx.value);
const pickerPaddingHeight = computed<number>(
  () => ((PICKER_VISIBLE_COUNT - 1) / 2) * pickerItemHeightPx.value,
);

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
  const winnerScore = props.result?.totalScore ?? 0;
  return [
    {
      id: "winner",
      label: "赢家",
      kind: "winner" as const,
      scoreValue: winnerScore,
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
    {
      id: "baosanjia",
      label: "包赔",
      kind: "baosanjia" as const,
      scoreValue: winnerScore,
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

  if (selectedOption.value.kind === "baosanjia") {
    return -selectedOption.value.scoreValue * 3;
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

function resetPanelState(): void {
  selectedOptionId.value = "";
  selfGangScore.value = 0;
  otherGangTotalScore.value = 0;
}

function handleSaveRound(): void {
  if (!props.result) {
    return;
  }

  if (!props.handType || !props.winMethod) {
    triggerToast("请先选择牌型和胡法", "error");
    return;
  }

  if (!selectedOption.value) {
    triggerToast("请选择胡牌信息", "error");
    return;
  }

  const selected = selectedOption.value;
  emit("save-round", {
    handType: props.handType,
    winMethod: props.winMethod,
    scoreResult: props.result,
    selectedOptionId: selected?.id ?? null,
    selectedOptionLabel: selected?.label ?? null,
    huScore: recordResult.value,
    selfGangScore: selfGangScore.value,
    otherGangScore: otherGangTotalScore.value,
    selfGangResult: selfGangResult.value,
    otherGangResult: otherGangResult.value,
    gangScore: gangRecordResult.value,
    roundTotalScore: roundTotalScore.value,
  });

  triggerToast("保存成功", "success");
}

function handlePrimaryAction(): void {
  if (props.mode === "calculator") {
    resetPanelState();
    emit("reset-calculator");
    return;
  }

  handleSaveRound();
}

function triggerToast(message: string, kind: "success" | "error"): void {
  toastMessage.value = message;
  toastKind.value = kind;
  showToast.value = true;
  if (saveToastTimer !== null) {
    window.clearTimeout(saveToastTimer);
  }
  saveToastTimer = window.setTimeout(() => {
    showToast.value = false;
    saveToastTimer = null;
  }, 3000);
}

function clampGangValue(value: number): number {
  return Math.min(GANG_MAX, Math.max(GANG_MIN, value));
}

function syncRemBasePx(): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  remBasePx.value = Number.isFinite(nextValue) ? nextValue : 16;
}

function syncPickerScroll(pickerRef: HTMLDivElement | null, value: number): void {
  if (!pickerRef) {
    return;
  }

  pickerRef.scrollTop = value * pickerItemHeightPx.value;
}

function setSelfGangScore(value: number): void {
  selfGangScore.value = clampGangValue(value);
}

function setOtherGangScore(value: number): void {
  otherGangTotalScore.value = clampGangValue(value);
}

function onGangPickerScroll(type: "self" | "other", event: Event): void {
  const target = event.target as HTMLDivElement;
  const nextValue = clampGangValue(Math.round(target.scrollTop / pickerItemHeightPx.value));

  if (type === "self" && nextValue !== selfGangScore.value) {
    selfGangScore.value = nextValue;
  }

  if (type === "other" && nextValue !== otherGangTotalScore.value) {
    otherGangTotalScore.value = nextValue;
  }
}

onMounted(() => {
  syncRemBasePx();
  window.addEventListener("resize", syncRemBasePx);
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

watch(remBasePx, () => {
  syncPickerScroll(selfGangPickerRef.value, selfGangScore.value);
  syncPickerScroll(otherGangPickerRef.value, otherGangTotalScore.value);
});

watch(
  () => props.resetVersion,
  () => {
    resetPanelState();
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", syncRemBasePx);
  if (saveToastTimer !== null) {
    window.clearTimeout(saveToastTimer);
  }
});
</script>

<template>
  <section class="rounded-[0.25rem] bg-[var(--bg-card-bottom)] p-4 shadow-[var(--box-shadow)]">
    <div
      class="rounded-[0.25rem] border border-[#E0E0E0] bg-[var(--bg-content)] p-4"
    >
      <p v-if="errorMessage" class="text-base leading-5 text-[var(--error-color)]">
        {{ errorMessage }}
      </p>
      <div v-else-if="result" class="relative w-full">
        <div class="grid gap-2">
          <div class="rounded bg-white">
            <div class="grid grid-cols-4 gap-2">
              <label
                v-for="option in roleOptions"
                :key="option.id"
                :class="[
                  'inline-flex min-w-0 items-center justify-center gap-1 rounded border px-2 py-1 text-sm',
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
                    option.kind === 'baosanjia'
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

          <div class="rounded bg-white">
            <div class="grid grid-cols-4 gap-2">
              <label
                v-for="option in normalScoreOptions"
                :key="option.id"
                class="inline-flex min-w-0 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded border border-slate-300 px-2 py-1 text-sm"
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
              <div class="flex min-w-0 items-center justify-end rounded border border-slate-200 bg-slate-50 px-3 py-1 text-sm">
                <span :class="['text-lg font-bold leading-none', recordResultClass]">
                  {{ recordResult }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-12 gap-2">
          <div class="col-span-9 grid grid-cols-2 gap-2 min-w-0">
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
                  <div :style="{ height: `${pickerPaddingHeight}px` }"></div>
                  <button
                    v-for="value in gangScoreValues"
                    :key="`self-${value}`"
                    class="picker-item"
                    type="button"
                    @click="setSelfGangScore(value)"
                  >
                    <span :class="value === selfGangScore ? 'picker-item-active' : 'picker-item-text'">{{ value }}</span>
                  </button>
                  <div :style="{ height: `${pickerPaddingHeight}px` }"></div>
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
                  <div :style="{ height: `${pickerPaddingHeight}px` }"></div>
                  <button
                    v-for="value in gangScoreValues"
                    :key="`other-${value}`"
                    class="picker-item"
                    type="button"
                    @click="setOtherGangScore(value)"
                  >
                    <span :class="value === otherGangTotalScore ? 'picker-item-active' : 'picker-item-text'">{{ value }}</span>
                  </button>
                  <div :style="{ height: `${pickerPaddingHeight}px` }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-3 relative flex flex-col items-center justify-center rounded border border-slate-200 bg-slate-50 px-2 py-2 text-sm">
            <span :class="['text-2xl font-bold', gangRecordResultClass]">{{ gangRecordResult }}</span>
          </div>
        </div>

        <p class="mt-1 text-xs text-slate-500 sm:whitespace-nowrap">内杠计3倍正分，外杠计1倍负分</p>

        <div class="mt-3 grid grid-cols-12 gap-2">
          <div class="col-span-6">
            <button
              class="h-full w-full rounded border border-[var(--primary-color)] bg-[var(--primary-color)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] hover:shadow active:scale-[0.99] active:bg-[var(--primary-active)]"
              type="button"
              @click="handlePrimaryAction"
            >
              {{ props.mode === "calculator" ? "重置" : "保存本局" }}
            </button>
          </div>
          <div class="col-span-6 flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span class="text-slate-600">总分</span>
            <span :class="['text-2xl font-bold leading-none', roundTotalScoreClass]">{{ roundTotalScore }}</span>
          </div>
        </div>

        <transition name="save-tip">
          <div
            v-if="showToast"
            :class="[
              'pointer-events-none absolute bottom-3 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded px-4 py-2 text-sm font-medium text-white shadow-lg',
              toastKind === 'success' ? 'bg-black/85' : 'bg-[var(--error-color)]/95',
            ]"
          >
            {{ toastMessage }}
          </div>
        </transition>
      </div>
      <p v-else class="text-base leading-5 text-[#757575]">请选择上方牌型和胡法</p>
    </div>
  </section>
</template>

<style scoped>
.picker-wrap {
  position: relative;
  height: 5.625rem;
  overflow: hidden;
  border: 0.0625rem solid #cbd5e1;
  border-radius: 0.375rem;
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
  left: 0.375rem;
  right: 0.375rem;
  top: 50%;
  height: 1.875rem;
  transform: translateY(-50%);
  border-top: 0.0625rem solid #cbd5e1;
  border-bottom: 0.0625rem solid #cbd5e1;
  pointer-events: none;
  z-index: 1;
}

.picker-item {
  width: 100%;
  height: 1.875rem;
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
  font-size: 0.8125rem;
}

.picker-item-active {
  color: #0f172a;
  font-weight: 700;
  font-size: 0.875rem;
}

.save-tip-enter-active,
.save-tip-leave-active {
  transition: opacity 0.2s ease;
}

.save-tip-enter-from,
.save-tip-leave-to {
  opacity: 0;
}
</style>
