<script setup lang="ts">
import { computed, ref } from "vue";
import OptionRadioGroup from "../components/OptionRadioGroup.vue";
import ScoreResultPanel from "../components/ScoreResultPanel.vue";
import { calculateScore, type ScoreResult } from "../utils/calculateScore";
import type { AppMode } from "../utils/appSettings";
import type { RoundCalculatorSnapshot } from "../utils/peakStore";
import { HAND_TYPE_OPTIONS, WIN_METHOD_OPTIONS, type HandType, type WinMethod } from "../utils/scoringRules";

const props = defineProps<{
  hasActivePeak: boolean;
  mode: AppMode;
}>();

const emit = defineEmits<{
  (event: "start-peak"): void;
  (event: "save-round", snapshot: RoundCalculatorSnapshot): void;
}>();

const selectedHandType = ref<HandType>(HAND_TYPE_OPTIONS[0]);
const selectedWinMethod = ref<WinMethod>(WIN_METHOD_OPTIONS[0]);
const resetVersion = ref(0);

const handTypeOptions = HAND_TYPE_OPTIONS.map((value) => ({ label: value, value }));
const winMethodOptions = WIN_METHOD_OPTIONS.map((value) => ({ label: value, value }));
const result = computed<ScoreResult>(() =>
  calculateScore({
    handType: selectedHandType.value,
    winMethod: selectedWinMethod.value,
  }),
);
const shouldShowStartPeak = computed(() => props.mode === "record" && !props.hasActivePeak);
const shouldShowCalculator = computed(() => props.mode === "calculator" || props.hasActivePeak);

function onHandTypeChange(value: string): void {
  selectedHandType.value = value as HandType;
}

function onWinMethodChange(value: string): void {
  selectedWinMethod.value = value as WinMethod;
}

function onStartPeak(): void {
  emit("start-peak");
}

function resetCalculatorState(): void {
  selectedHandType.value = HAND_TYPE_OPTIONS[0];
  selectedWinMethod.value = WIN_METHOD_OPTIONS[0];
  resetVersion.value += 1;
}

function onSaveRound(snapshot: RoundCalculatorSnapshot): void {
  emit("save-round", snapshot);
  resetCalculatorState();
}

function onResetCalculator(): void {
  resetCalculatorState();
}
</script>

<template>
  <main class="h-full overflow-y-auto bg-[var(--bg-page)] px-3 py-5 sm:px-5">
    <div class="mx-auto flex w-full max-w-[42rem] flex-col gap-4 rounded-[0.25rem] bg-[var(--bg-content)] p-4 shadow-[var(--box-shadow)]">
      <header>
        <h1 class="mb-2 text-center text-[1.25rem] leading-6 font-medium text-[var(--primary-color)]">长春麻将算分器</h1>
      </header>

      <section v-if="shouldShowStartPeak" class="rounded-[0.25rem] bg-[var(--bg-card-top)] p-4 shadow-[var(--box-shadow)]">
        <div class="flex flex-col items-center gap-3 py-3">
          <p class="text-sm text-slate-600">当前没有进行中的峰</p>
          <button
            class="rounded border border-[var(--primary-color)] bg-[var(--primary-color)] px-4 py-2 text-sm font-medium text-white"
            type="button"
            @click="onStartPeak"
          >
            开启新的一峰
          </button>
        </div>
      </section>

      <section v-if="shouldShowCalculator" class="rounded-[0.25rem] bg-[var(--bg-card-top)] p-4 shadow-[var(--box-shadow)]">
        <div class="flex flex-col gap-4">
          <OptionRadioGroup
            name="handType"
            title="牌型"
            :options="handTypeOptions"
            :model-value="selectedHandType"
            :show-error="false"
            @update:model-value="onHandTypeChange"
          />

          <OptionRadioGroup
            name="winMethod"
            title="胡法"
            :options="winMethodOptions"
            :model-value="selectedWinMethod"
            :show-error="false"
            @update:model-value="onWinMethodChange"
          />
        </div>
      </section>

      <ScoreResultPanel
        v-if="shouldShowCalculator"
        :result="result"
        :error-message="null"
        :hand-type="selectedHandType"
        :win-method="selectedWinMethod"
        :mode="props.mode"
        :reset-version="resetVersion"
        @reset-calculator="onResetCalculator"
        @save-round="onSaveRound"
      />
    </div>
  </main>
</template>
