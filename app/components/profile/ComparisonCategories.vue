<script setup lang="ts">
const props = defineProps<{
  categories: Array<{
    category: string
    label: string
    color: string
    baselineTime: number
    baselinePercentage: number
    comparisonTime: number
    comparisonPercentage: number
    timeDiff: number
    percentageDiff: number
  }>
}>()

const { formatTime, formatPercentage } = useProfileParser()
const { formatDiff, formatDiffPercentage, getDiffColor } = useProfileComparison()

const maxTime = computed(() => {
  let max = 0
  props.categories.forEach(c => {
    max = Math.max(max, c.baselineTime, c.comparisonTime)
  })
  return max
})

function getBarWidth(time: number): string {
  if (maxTime.value === 0) return '0%'
  return `${(time / maxTime.value) * 100}%`
}
</script>

<template>
  <div class="comparison-categories">
    <h3 class="text-sm font-semibold text-[var(--log-text)] mb-4 flex items-center gap-2">
      <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-[#00DC82]" />
      Category Comparison
    </h3>

    <div class="space-y-4">
      <div
        v-for="cat in categories"
        :key="cat.category"
        class="p-4 bg-[var(--log-bg)] rounded-lg"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: cat.color }" />
            <span class="text-sm font-medium text-[var(--log-text)]">{{ cat.label }}</span>
          </div>
          <div :class="['font-mono text-sm font-semibold', getDiffColor(cat.timeDiff)]">
            {{ formatDiff(cat.timeDiff) }}
            <span class="text-xs opacity-75">({{ formatDiffPercentage(cat.percentageDiff) }})</span>
          </div>
        </div>

        <!-- Comparison bars -->
        <div class="space-y-2">
          <!-- Baseline -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-blue-400 w-20">Baseline</span>
            <div class="flex-1 h-3 bg-[var(--log-surface)] rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-400/50 rounded-full transition-all"
                :style="{ width: getBarWidth(cat.baselineTime) }"
              />
            </div>
            <span class="font-mono text-xs text-[var(--log-text-muted)] w-20 text-right">
              {{ formatTime(cat.baselineTime) }}
            </span>
          </div>

          <!-- Comparison -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#00DC82] w-20">Comparison</span>
            <div class="flex-1 h-3 bg-[var(--log-surface)] rounded-full overflow-hidden">
              <div
                class="h-full bg-[#00DC82]/50 rounded-full transition-all"
                :style="{ width: getBarWidth(cat.comparisonTime) }"
              />
            </div>
            <span class="font-mono text-xs text-[var(--log-text-muted)] w-20 text-right">
              {{ formatTime(cat.comparisonTime) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparison-categories {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  padding: 20px;
}
</style>

