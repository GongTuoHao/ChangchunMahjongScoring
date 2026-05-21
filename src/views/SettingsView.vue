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
    <div class="mx-auto flex w-full max-w-[600px] flex-col gap-4 rounded-[4px] bg-[var(--bg-content)] p-4 shadow-[var(--box-shadow)]">
      <header>
        <h1 class="text-center text-[20px] leading-6 font-medium text-[var(--primary-color)]">设置</h1>
      </header>

      <section class="rounded-[4px] bg-[var(--bg-card-top)] p-4 shadow-[var(--box-shadow)]">
        <div class="rounded-[4px] border border-slate-200 bg-white p-4">
          <div class="flex flex-col gap-3">
            <div>
              <h2 class="text-sm font-semibold text-slate-700">切换模式</h2>
              <p class="mt-1 text-xs text-slate-500">记录模式保留对局记录，计算模式仅用于临时算分。</p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                :class="[
                  'rounded border px-3 py-2 text-sm font-medium transition-colors',
                  props.mode === 'record'
                    ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                ]"
                type="button"
                @click="updateMode('record')"
              >
                记录模式
              </button>
              <button
                :class="[
                  'rounded border px-3 py-2 text-sm font-medium transition-colors',
                  props.mode === 'calculator'
                    ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
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
