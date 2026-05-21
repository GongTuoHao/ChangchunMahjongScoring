<script setup lang="ts">
import { ref, watch } from "vue";
import type { PeakRecord } from "../utils/peakStore";

const props = defineProps<{
  peaks: PeakRecord[];
}>();

const emit = defineEmits<{
  (event: "complete-peak", peakId: string): void;
  (event: "amend-latest-round", payload: { peakId: string; huScore: number; gangScore: number }): void;
}>();

const expandedPeakIds = ref<string[]>(props.peaks.filter((peak) => peak.status === "active").map((peak) => peak.id));
const showCompleteConfirm = ref(false);
const pendingCompletePeakId = ref<string | null>(null);
const showAmendDialog = ref(false);
const amendTargetPeakId = ref<string | null>(null);
const amendHuScore = ref<number>(0);
const amendGangScore = ref<number>(0);

function formatDateOnly(isoText: string): string {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) {
    return isoText;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeOnly(isoText: string): string {
  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) {
    return isoText;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getPeakTotalScore(peak: PeakRecord): number {
  return peak.rounds.reduce((sum, round) => {
    if (round.status === "void") {
      return sum;
    }
    return sum + round.snapshot.roundTotalScore;
  }, 0);
}

function getSortedRounds(peak: PeakRecord): PeakRecord["rounds"] {
  return [...peak.rounds].sort((a, b) => b.roundNo - a.roundNo);
}

function syncExpandedActivePeaks(): void {
  const validIds = new Set(props.peaks.map((peak) => peak.id));
  const keepIds = expandedPeakIds.value.filter((id) => validIds.has(id));
  const activeIds = props.peaks.filter((peak) => peak.status === "active").map((peak) => peak.id);
  expandedPeakIds.value = Array.from(new Set([...keepIds, ...activeIds]));
}

function togglePeak(groupId: string): void {
  const current = expandedPeakIds.value;
  if (current.includes(groupId)) {
    expandedPeakIds.value = current.filter((id) => id !== groupId);
    return;
  }

  expandedPeakIds.value = [...current, groupId];
}

function isExpanded(groupId: string): boolean {
  return expandedPeakIds.value.includes(groupId);
}

function requestCompletePeak(peakId: string): void {
  pendingCompletePeakId.value = peakId;
  showCompleteConfirm.value = true;
}

function cancelCompletePeak(): void {
  showCompleteConfirm.value = false;
  pendingCompletePeakId.value = null;
}

function confirmCompletePeak(): void {
  if (!pendingCompletePeakId.value) {
    return;
  }

  emit("complete-peak", pendingCompletePeakId.value);
  showCompleteConfirm.value = false;
  pendingCompletePeakId.value = null;
}

function isLatestRound(peak: PeakRecord, roundId: string): boolean {
  const latestRound = getSortedRounds(peak)[0];
  return latestRound?.id === roundId;
}

function openAmendDialog(peakId: string): void {
  amendTargetPeakId.value = peakId;
  amendHuScore.value = 0;
  amendGangScore.value = 0;
  showAmendDialog.value = true;
}

function closeAmendDialog(): void {
  showAmendDialog.value = false;
  amendTargetPeakId.value = null;
}

function submitAmendLatestRound(): void {
  if (!amendTargetPeakId.value) {
    return;
  }

  emit("amend-latest-round", {
    peakId: amendTargetPeakId.value,
    huScore: amendHuScore.value,
    gangScore: amendGangScore.value,
  });
  closeAmendDialog();
}

watch(
  () => props.peaks,
  () => {
    syncExpandedActivePeaks();
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <section class="h-full overflow-y-auto bg-[var(--bg-page)] px-3 py-5 sm:px-5">
    <div class="mx-auto flex w-full max-w-[600px] flex-col gap-3 rounded-[4px] bg-[var(--bg-content)] p-4 shadow-[var(--box-shadow)]">
      <header>
        <h1 class="text-center text-[20px] leading-6 font-medium text-[var(--primary-color)]">对局列表</h1>
      </header>

      <div class="flex flex-col gap-3">
        <section
          v-for="peak in props.peaks"
          :key="peak.id"
          class="rounded border border-slate-200 bg-slate-50 p-3"
        >
          <div class="mb-2 flex w-full items-center justify-between rounded px-1 py-1">
            <span class="text-sm font-semibold text-[var(--primary-color)]">
              {{ formatDateOnly(peak.createdAt) }} 第 {{ peak.dayPeakNo }} 峰
            </span>
            <span class="flex items-center gap-2">
              <button
                v-if="peak.status === 'active'"
                class="rounded border border-[var(--error-color)] px-2 py-1 text-xs font-medium text-[var(--error-color)] transition-colors hover:bg-[var(--error-color)] hover:text-white active:scale-[0.98]"
                type="button"
                @click.stop="requestCompletePeak(peak.id)"
              >
                结束本峰
              </button>
              <button
                class="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 active:scale-[0.98]"
                type="button"
                @click="togglePeak(peak.id)"
              >
                {{ isExpanded(peak.id) ? "收起" : "展开" }}
              </button>
            </span>
          </div>

          <div
            v-if="!isExpanded(peak.id)"
            class="grid grid-cols-[1fr_auto] items-center rounded border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <span class="text-slate-600">时间：{{ formatTimeOnly(peak.createdAt) }}</span>
            <span :class="getPeakTotalScore(peak) >= 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-[var(--error-color)]'">
              总分：{{ getPeakTotalScore(peak) }}
            </span>
          </div>

          <div v-else-if="peak.rounds.length === 0" class="rounded border border-dashed border-slate-300 bg-white px-3 py-3 text-center text-sm text-slate-500">
            暂无对局记录
          </div>

          <ul v-else class="flex flex-col gap-2">
            <li
              v-for="round in getSortedRounds(peak)"
              :key="round.id"
              :class="[
                'rounded border px-3 py-2 text-sm text-slate-700',
                round.status === 'void' ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white',
              ]"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="grid grid-cols-[auto_1fr] grid-rows-2 items-start gap-x-2">
                    <span class="row-span-2 self-center text-xl font-semibold leading-none">{{ round.roundNo }}</span>
                    <p v-if="round.status === 'manual'" class="truncate">手动修改</p>
                    <p v-else class="truncate">
                      {{ round.snapshot.handType }} | {{ round.snapshot.winMethod }} |
                      {{ round.snapshot.selectedOptionLabel ?? "-" }}
                    </p>
                    <p class="text-xs text-slate-500">胡分：{{ round.snapshot.huScore }} | 杠分：{{ round.snapshot.gangScore }}</p>
                  </div>
                </div>
                <div class="shrink-0 flex items-center gap-2">
                  <span
                    class="text-base font-semibold"
                    :class="[
                      round.snapshot.roundTotalScore >= 0 ? 'text-emerald-700' : 'text-[var(--error-color)]',
                      round.status === 'void' ? 'line-through decoration-2' : '',
                    ]"
                  >
                    {{ round.snapshot.roundTotalScore }}
                  </span>
                  <button
                    v-if="peak.status === 'active' && isLatestRound(peak, round.id)"
                    class="rounded border border-[var(--primary-color)] px-2 py-0.5 text-xs font-medium text-[var(--primary-color)] transition-colors hover:bg-[var(--primary-color)] hover:text-white active:scale-[0.98]"
                    type="button"
                    @click="openAmendDialog(peak.id)"
                  >
                    修改
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <p v-if="props.peaks.length === 0" class="rounded border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-sm text-slate-500">
          暂无峰记录，请先在计算器页面开启新峰并保存对局。
        </p>
      </div>
    </div>

    <transition name="dialog-fade">
      <div
        v-if="showCompleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      >
        <div class="w-full max-w-sm rounded border border-slate-200 bg-white p-4 shadow-xl">
          <h2 class="text-base font-semibold text-slate-800">结束本峰</h2>
          <p class="mt-2 text-sm text-slate-600">确认结束本峰吗？结束后将无法继续在该峰内记录对局。</p>
          <div class="mt-4 flex justify-end gap-2">
            <button
              class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
              type="button"
              @click="cancelCompletePeak"
            >
              取消
            </button>
            <button
              class="rounded border border-[var(--error-color)] bg-[var(--error-color)] px-3 py-1.5 text-sm text-white transition-colors hover:opacity-90"
              type="button"
              @click="confirmCompletePeak"
            >
              确认结束
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="dialog-fade">
      <div
        v-if="showAmendDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      >
        <div class="w-full max-w-sm rounded border border-slate-200 bg-white p-4 shadow-xl">
          <h2 class="text-base font-semibold text-slate-800">手动修改最新一局</h2>
          <p class="mt-1 text-xs text-slate-500">原记录会标记为作废，并新增一条“手动添加”记录。</p>

          <div class="mt-3 grid grid-cols-2 gap-3">
            <label class="flex flex-col gap-1 text-sm text-slate-700">
              <span>胡分</span>
              <input
                v-model.number="amendHuScore"
                class="rounded border border-slate-300 px-2 py-1 outline-none focus:border-[var(--primary-color)]"
                step="1"
                type="number"
              />
            </label>
            <label class="flex flex-col gap-1 text-sm text-slate-700">
              <span>杠分</span>
              <input
                v-model.number="amendGangScore"
                class="rounded border border-slate-300 px-2 py-1 outline-none focus:border-[var(--primary-color)]"
                step="1"
                type="number"
              />
            </label>
          </div>

          <div class="mt-4 flex justify-end gap-2">
            <button
              class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
              type="button"
              @click="closeAmendDialog"
            >
              取消
            </button>
            <button
              class="rounded border border-[var(--primary-color)] bg-[var(--primary-color)] px-3 py-1.5 text-sm text-white transition-colors hover:opacity-90"
              type="button"
              @click="submitAmendLatestRound"
            >
              保存修改
            </button>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
