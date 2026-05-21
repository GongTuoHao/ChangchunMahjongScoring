<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { loadAppSettings, persistAppSettings, type AppMode, type AppSettings } from "./utils/appSettings";
import type { RoundCalculatorSnapshot } from "./utils/peakStore";
import {
  addRoundToActivePeak,
  amendLatestRound,
  completePeak,
  getActivePeak,
  loadPeakStore,
  persistPeakStore,
  startNewPeak,
} from "./utils/peakStore";
import RecordListView from "./views/RecordListView.vue";
import ScoringView from "./views/ScoringView.vue";
import SettingsView from "./views/SettingsView.vue";

type TabKey = "list" | "calculator" | "settings";

const activeTab = ref<TabKey>("calculator");
const peakStore = ref(loadPeakStore());
const appSettings = ref<AppSettings>(loadAppSettings());
const activePeak = computed(() => getActivePeak(peakStore.value));
const hasActivePeak = computed(() => activePeak.value !== null);
const appMode = computed<AppMode>(() => appSettings.value.mode);
const scoreCap = computed<number>(() => appSettings.value.scoreCap);
const isRecordMode = computed(() => appMode.value === "record");
const peaks = computed(() => [...peakStore.value.peaks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

function switchTab(tab: TabKey): void {
  if (tab === "list" && !isRecordMode.value) {
    activeTab.value = "calculator";
    return;
  }
  activeTab.value = tab;
}

function updateMode(mode: AppMode): void {
  appSettings.value = {
    ...appSettings.value,
    mode,
  };
  persistAppSettings(appSettings.value);
  if (mode === "calculator" && activeTab.value === "list") {
    activeTab.value = "calculator";
  }
}

function updateScoreCap(scoreCap: number): void {
  appSettings.value = {
    ...appSettings.value,
    scoreCap,
  };
  persistAppSettings(appSettings.value);
}

function handleStartPeak(): void {
  peakStore.value = startNewPeak(peakStore.value);
  persistPeakStore(peakStore.value);
}

function handleSaveRound(snapshot: RoundCalculatorSnapshot): void {
  peakStore.value = addRoundToActivePeak(peakStore.value, snapshot);
  persistPeakStore(peakStore.value);
}

function handleCompletePeak(peakId: string): void {
  peakStore.value = completePeak(peakStore.value, peakId);
  persistPeakStore(peakStore.value);
}

function handleAmendLatestRound(payload: { peakId: string; huScore: number; gangScore: number }): void {
  peakStore.value = amendLatestRound(peakStore.value, payload.peakId, payload.huScore, payload.gangScore);
  persistPeakStore(peakStore.value);
}

onMounted(() => {
  if (isRecordMode.value && hasActivePeak.value) {
    activeTab.value = "calculator";
  }
});
</script>

<template>
  <div class="h-dvh min-h-dvh overflow-hidden bg-[var(--bg-page)]">
    <div class="mx-auto flex h-full w-full min-w-0 max-w-[42rem] flex-col">
      <div class="flex-1 overflow-hidden">
        <RecordListView
          v-if="activeTab === 'list' && isRecordMode"
          :peaks="peaks"
          @complete-peak="handleCompletePeak"
          @amend-latest-round="handleAmendLatestRound"
        />
        <ScoringView
          v-else-if="activeTab === 'calculator'"
          :has-active-peak="hasActivePeak"
          :mode="appMode"
          :score-cap="scoreCap"
          @start-peak="handleStartPeak"
          @save-round="handleSaveRound"
        />
        <SettingsView
          v-else
          :mode="appMode"
          :score-cap="scoreCap"
          @update-mode="updateMode"
          @update-score-cap="updateScoreCap"
        />
      </div>

      <nav class="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div
          :class="[
            'grid w-full gap-2 px-3 py-2',
            isRecordMode
              ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.875rem]'
              : 'grid-cols-[minmax(0,1fr)_2.875rem]',
          ]"
        >
        <button
          v-if="isRecordMode"
          :class="[
            'flex min-w-0 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'list' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700',
          ]"
          type="button"
          @click="switchTab('list')"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 5h2v2H4V5zm4 0h12v2H8V5zm-4 6h2v2H4v-2zm4 0h12v2H8v-2zm-4 6h2v2H4v-2zm4 0h12v2H8v-2z" />
          </svg>
          <span>列表</span>
        </button>

        <button
          :class="[
            'flex min-w-0 items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors',
            activeTab === 'calculator' ? 'bg-[var(--primary-color)] text-white' : 'bg-slate-100 text-slate-700',
          ]"
          type="button"
          @click="switchTab('calculator')"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v4h10V4H7zm1 7h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM8 15h2v2H8v-2zm4 0h6v2h-6v-2z"
            />
          </svg>
          <span>计算器</span>
        </button>

        <button
          :class="[
            'flex items-center justify-center rounded px-3 py-2 transition-colors',
            activeTab === 'settings' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700',
          ]"
          type="button"
          @click="switchTab('settings')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.16 7.16 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.12-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
            />
          </svg>
        </button>
      </div>
      </nav>
    </div>
  </div>
</template>
