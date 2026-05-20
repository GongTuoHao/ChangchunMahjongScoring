<script setup lang="ts">
import { computed, ref } from "vue";
import OptionRadioGroup from "../components/OptionRadioGroup.vue";
import ScoreResultPanel from "../components/ScoreResultPanel.vue";
import { calculateScore, type ScoreResult } from "../utils/calculateScore";
import { HAND_TYPE_OPTIONS, WIN_METHOD_OPTIONS, type HandType, type WinMethod } from "../utils/scoringRules";

const selectedHandType = ref<HandType>(HAND_TYPE_OPTIONS[0]);
const selectedWinMethod = ref<WinMethod>(WIN_METHOD_OPTIONS[0]);

const handTypeOptions = HAND_TYPE_OPTIONS.map((value) => ({ label: value, value }));
const winMethodOptions = WIN_METHOD_OPTIONS.map((value) => ({ label: value, value }));
const result = computed<ScoreResult>(() =>
  calculateScore({
    handType: selectedHandType.value,
    winMethod: selectedWinMethod.value,
  }),
);

function onHandTypeChange(value: string): void {
  selectedHandType.value = value as HandType;
}

function onWinMethodChange(value: string): void {
  selectedWinMethod.value = value as WinMethod;
}
</script>

<template>
  <main class="min-h-screen bg-[var(--bg-page)] px-3 py-5 sm:px-5">
    <div class="mx-auto flex w-full max-w-[600px] flex-col gap-4 rounded-[4px] bg-[var(--bg-content)] p-4 shadow-[var(--box-shadow)]">
      <header>
        <h1 class="mb-2 text-center text-[20px] leading-6 font-medium text-[var(--primary-color)]">长春麻将算分器</h1>
      </header>

      <section class="rounded-[4px] bg-[var(--bg-card-top)] p-4 shadow-[var(--box-shadow)]">
        <div class="flex flex-col gap-4">
          <OptionRadioGroup
            name="handType"
            title="选择牌型"
            :options="handTypeOptions"
            :model-value="selectedHandType"
            :show-error="false"
            @update:model-value="onHandTypeChange"
          />

          <OptionRadioGroup
            name="winMethod"
            title="选择胡法"
            :options="winMethodOptions"
            :model-value="selectedWinMethod"
            :show-error="false"
            @update:model-value="onWinMethodChange"
          />
        </div>
      </section>

      <ScoreResultPanel :result="result" :error-message="null" />
    </div>
  </main>
</template>
