<script setup lang="ts">
import type { AppMode } from "../utils/appSettings";

const props = defineProps<{
  mode: AppMode;
}>();

const emit = defineEmits<{
  (event: "update-mode", mode: AppMode): void;
}>();

function updateMode(mode: AppMode): void {
  emit("update-mode", mode);
}
</script>

<template>
  <section class="h-full overflow-y-auto bg-[var(--bg-page)] px-3 py-5 sm:px-5">
    <div class="mx-auto flex w-full max-w-[42rem] flex-col gap-4 rounded-[0.25rem] bg-[var(--bg-content)] p-4 shadow-[var(--box-shadow)]">
      <header>
        <h1 class="text-center text-[1.25rem] leading-6 font-medium text-[var(--primary-color)]">设置</h1>
      </header>

      <section class="rounded-[0.25rem] bg-[var(--bg-card-top)] p-4 shadow-[var(--box-shadow)]">
        <div class="rounded-[0.25rem] border border-slate-200 bg-white p-4">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0 shrink-0">
              <h2 class="text-sm font-semibold text-slate-700">切换模式</h2>
            </div>

            <div class="inline-grid shrink-0 grid-cols-2 gap-1 rounded-[0.5rem] bg-slate-100 p-1">
              <button
                :class="[
                  'rounded-[0.375rem] px-3 py-2 text-sm font-medium transition-all',
                  props.mode === 'record'
                    ? 'bg-white text-slate-900 shadow-[0_0.125rem_0.25rem_rgba(15,23,42,0.12)]'
                    : 'bg-transparent text-slate-600 hover:text-slate-800',
                ]"
                type="button"
                @click="updateMode('record')"
              >
                记录模式
              </button>
              <button
                :class="[
                  'rounded-[0.375rem] px-3 py-2 text-sm font-medium transition-all',
                  props.mode === 'calculator'
                    ? 'bg-white text-slate-900 shadow-[0_0.125rem_0.25rem_rgba(15,23,42,0.12)]'
                    : 'bg-transparent text-slate-600 hover:text-slate-800',
                ]"
                type="button"
                @click="updateMode('calculator')"
              >
                计算模式
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
