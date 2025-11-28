<script setup lang="ts">
const props = defineProps<{
  statsComparison: {
    totalTime: { baseline: number; comparison: number; diff: number; diffPercentage: number }
    totalSamples: { baseline: number; comparison: number; diff: number; diffPercentage: number }
    totalNodes: { baseline: number; comparison: number; diff: number; diffPercentage: number }
    gcTime: { baseline: number; comparison: number; diff: number; diffPercentage: number }
  } | null
  baselineFileName: string
  comparisonFileName: string
  regressionsCount: number
  improvementsCount: number
}>()

const { formatTime, formatPercentage } = useProfileParser()
const { formatDiff, formatDiffPercentage, getDiffColor } = useProfileComparison()

const overallVerdict = computed(() => {
  if (!props.statsComparison) return null
  
  const diff = props.statsComparison.totalTime.diffPercentage
  
  if (diff < -5) return { label: 'Significant Improvement', color: 'text-green-400', icon: 'i-heroicons-arrow-trending-down', bg: 'bg-green-500/10' }
  if (diff < -1) return { label: 'Minor Improvement', color: 'text-green-400', icon: 'i-heroicons-arrow-down', bg: 'bg-green-500/10' }
  if (diff > 5) return { label: 'Significant Regression', color: 'text-red-400', icon: 'i-heroicons-arrow-trending-up', bg: 'bg-red-500/10' }
  if (diff > 1) return { label: 'Minor Regression', color: 'text-red-400', icon: 'i-heroicons-arrow-up', bg: 'bg-red-500/10' }
  return { label: 'No Significant Change', color: 'text-[var(--log-text-muted)]', icon: 'i-heroicons-minus', bg: 'bg-[var(--log-surface)]' }
})
</script>

<template>
  <div v-if="statsComparison" class="comparison-summary space-y-6">
    <!-- Overall Verdict -->
    <div
      class="p-6 rounded-xl border border-[var(--log-border)] flex items-center justify-between"
      :class="overallVerdict?.bg"
    >
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--log-surface)]">
          <UIcon :name="overallVerdict?.icon || 'i-heroicons-minus'" :class="overallVerdict?.color" class="w-8 h-8" />
        </div>
        <div>
          <h3 :class="['text-xl font-bold', overallVerdict?.color]">
            {{ overallVerdict?.label }}
          </h3>
          <p class="text-[var(--log-text-muted)] text-sm mt-1">
            Total time {{ statsComparison.totalTime.diff > 0 ? 'increased' : 'decreased' }} by 
            <span :class="getDiffColor(statsComparison.totalTime.diff)">
              {{ formatDiffPercentage(statsComparison.totalTime.diffPercentage) }}
            </span>
          </p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-mono font-bold" :class="getDiffColor(statsComparison.totalTime.diff)">
          {{ formatDiff(statsComparison.totalTime.diff) }}
        </div>
        <div class="text-sm text-[var(--log-text-muted)]">
          {{ formatTime(statsComparison.totalTime.baseline) }} → {{ formatTime(statsComparison.totalTime.comparison) }}
        </div>
      </div>
    </div>

    <!-- File Names -->
    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-[var(--log-surface)] rounded-lg border border-[var(--log-border)]">
        <div class="text-xs text-blue-400 uppercase tracking-wider mb-1">Baseline</div>
        <div class="font-mono text-sm text-[var(--log-text)] truncate" :title="baselineFileName">
          {{ baselineFileName }}
        </div>
      </div>
      <div class="p-4 bg-[var(--log-surface)] rounded-lg border border-[var(--log-border)]">
        <div class="text-xs text-[#00DC82] uppercase tracking-wider mb-1">Comparison</div>
        <div class="font-mono text-sm text-[var(--log-text)] truncate" :title="comparisonFileName">
          {{ comparisonFileName }}
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Total Time -->
      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-blue-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Total Time</span>
        </div>
        <div class="font-mono text-xl font-bold" :class="getDiffColor(statsComparison.totalTime.diff)">
          {{ formatDiff(statsComparison.totalTime.diff) }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)] mt-1">
          {{ formatDiffPercentage(statsComparison.totalTime.diffPercentage) }}
        </div>
      </div>

      <!-- Samples -->
      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-purple-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Samples</span>
        </div>
        <div class="font-mono text-xl font-bold text-[var(--log-text)]">
          {{ statsComparison.totalSamples.diff > 0 ? '+' : '' }}{{ statsComparison.totalSamples.diff.toLocaleString() }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)] mt-1">
          {{ formatDiffPercentage(statsComparison.totalSamples.diffPercentage) }}
        </div>
      </div>

      <!-- Regressions -->
      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5 text-red-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Regressions</span>
        </div>
        <div class="font-mono text-xl font-bold text-red-400">
          {{ regressionsCount }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)] mt-1">
          functions slower
        </div>
      </div>

      <!-- Improvements -->
      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5 text-green-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Improvements</span>
        </div>
        <div class="font-mono text-xl font-bold text-green-400">
          {{ improvementsCount }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)] mt-1">
          functions faster
        </div>
      </div>
    </div>

    <!-- GC Comparison -->
    <div v-if="statsComparison.gcTime.baseline > 0 || statsComparison.gcTime.comparison > 0" class="p-4 bg-[var(--log-surface)] rounded-lg border border-[var(--log-border)]">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-trash" class="w-5 h-5 text-orange-400" />
          <span class="text-sm text-[var(--log-text)]">Garbage Collection</span>
        </div>
        <div class="text-right">
          <span class="font-mono text-sm" :class="getDiffColor(statsComparison.gcTime.diff)">
            {{ formatDiff(statsComparison.gcTime.diff) }}
          </span>
          <span class="text-xs text-[var(--log-text-muted)] ml-2">
            ({{ formatTime(statsComparison.gcTime.baseline) }} → {{ formatTime(statsComparison.gcTime.comparison) }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

