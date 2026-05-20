<script setup lang="ts">
import type { ScoreResult } from "../utils/calculateScore";

defineProps<{
  result: ScoreResult | null;
  errorMessage: string | null;
}>();
</script>

<template>
  <section class="rounded-[4px] bg-[var(--bg-card-bottom)] p-4 shadow-[var(--box-shadow)]">
    <div
      class="flex min-h-20 items-center justify-center rounded-[4px] border border-[#E0E0E0] bg-[var(--bg-content)] p-4 text-center"
    >
      <p v-if="errorMessage" class="text-base leading-5 text-[var(--error-color)]">
        {{ errorMessage }}
      </p>
      <p v-else-if="result" class="text-2xl leading-8 font-bold text-[var(--primary-color)]">
        {{ result.scoreText }}
      </p>
      <p v-else class="text-base leading-5 text-[#757575]">请选择上方牌型和胡法后点击计算</p>
    </div>
  </section>
</template>
