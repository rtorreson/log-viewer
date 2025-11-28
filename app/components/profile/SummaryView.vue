<script setup lang="ts">
import type { SummaryData, ProfileStats, CategoryStats } from '~/types/profile'

const props = defineProps<{
  summary: SummaryData | null
  stats: ProfileStats | null
}>()

const { formatTime, formatPercentage, categoryColors } = useProfileParser()

// Calculate pie chart paths
const pieChartPaths = computed(() => {
  if (!props.summary?.categoryBreakdown.length) return []

  const paths: Array<{
    path: string
    color: string
    label: string
    percentage: number
  }> = []

  let currentAngle = 0
  const total = props.summary.categoryBreakdown.reduce((sum, c) => sum + c.percentage, 0)

  props.summary.categoryBreakdown.forEach(category => {
    const angle = (category.percentage / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
    const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
    const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180)
    const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180)

    const largeArc = angle > 180 ? 1 : 0

    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`

    paths.push({
      path,
      color: category.color,
      label: category.label,
      percentage: category.percentage,
    })

    currentAngle += angle
  })

  return paths
})

// Histogram max value for scaling
const histogramMax = computed(() => {
  if (!props.summary?.timelineHistogram.length) return 1
  return Math.max(...props.summary.timelineHistogram.map(b => b.percentage))
})
</script>

<template>
  <div v-if="summary && stats" class="summary-view space-y-6">
    <!-- Overview Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-blue-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Total Time</span>
        </div>
        <div class="font-mono text-2xl font-bold text-[var(--log-text)]">
          {{ formatTime(stats.totalTime) }}
        </div>
      </div>

      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-purple-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Samples</span>
        </div>
        <div class="font-mono text-2xl font-bold text-[var(--log-text)]">
          {{ stats.totalSamples.toLocaleString() }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)] mt-1">
          {{ stats.samplesPerSecond.toFixed(0) }}/sec
        </div>
      </div>

      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-rectangle-stack" class="w-5 h-5 text-amber-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">Functions</span>
        </div>
        <div class="font-mono text-2xl font-bold text-[var(--log-text)]">
          {{ stats.totalNodes.toLocaleString() }}
        </div>
      </div>

      <div class="stats-card">
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-heroicons-trash" class="w-5 h-5 text-orange-400" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase">GC Time</span>
        </div>
        <div class="font-mono text-2xl font-bold text-[var(--log-text)]">
          {{ formatTime(stats.gcTime || 0) }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)] mt-1">
          {{ formatPercentage(((stats.gcTime || 0) / stats.totalTime) * 100) }}
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Category Breakdown (Pie Chart) -->
      <div class="chart-card">
        <h3 class="text-sm font-semibold text-[var(--log-text)] mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-[#00DC82]" />
          Category Breakdown
        </h3>
        <div class="flex items-center gap-8">
          <!-- Pie Chart -->
          <svg viewBox="0 0 100 100" class="w-32 h-32">
            <circle cx="50" cy="50" r="40" fill="var(--log-surface-2)" />
            <path
              v-for="(segment, index) in pieChartPaths"
              :key="index"
              :d="segment.path"
              :fill="segment.color"
              class="transition-opacity hover:opacity-80 cursor-pointer"
            />
            <!-- Center hole -->
            <circle cx="50" cy="50" r="20" fill="var(--log-surface)" />
          </svg>

          <!-- Legend -->
          <div class="flex-1 space-y-2">
            <div
              v-for="category in summary.categoryBreakdown.slice(0, 6)"
              :key="category.category"
              class="flex items-center gap-2"
            >
              <div
                class="w-3 h-3 rounded-sm"
                :style="{ backgroundColor: category.color }"
              />
              <span class="text-sm text-[var(--log-text)] flex-1">{{ category.label }}</span>
              <span class="font-mono text-sm text-[var(--log-text-muted)]">
                {{ formatPercentage(category.percentage) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Functions Bar Chart -->
      <div class="chart-card">
        <h3 class="text-sm font-semibold text-[var(--log-text)] mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-[#00DC82]" />
          Hottest Functions
        </h3>
        <div class="space-y-2">
          <div
            v-for="fn in summary.topFunctionsChart.slice(0, 8)"
            :key="fn.name"
            class="flex items-center gap-3"
          >
            <div class="w-24 text-xs font-mono text-[var(--log-text)] truncate" :title="fn.name">
              {{ fn.name }}
            </div>
            <div class="flex-1 h-4 bg-[var(--log-bg)] rounded overflow-hidden">
              <div
                class="h-full rounded transition-all"
                :style="{
                  width: `${Math.max(fn.percentage, 1)}%`,
                  backgroundColor: fn.color,
                }"
              />
            </div>
            <div class="w-16 text-right font-mono text-xs text-[var(--log-text-muted)]">
              {{ formatPercentage(fn.percentage) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Activity Histogram -->
    <div class="chart-card">
      <h3 class="text-sm font-semibold text-[var(--log-text)] mb-4 flex items-center gap-2">
        <UIcon name="i-heroicons-chart-bar-square" class="w-5 h-5 text-[#00DC82]" />
        Timeline Activity
      </h3>
      <div class="flex items-end gap-1 h-24">
        <div
          v-for="(bucket, index) in summary.timelineHistogram"
          :key="index"
          class="flex-1 bg-[#00DC82]/30 hover:bg-[#00DC82]/50 rounded-t transition-colors cursor-pointer"
          :style="{ height: `${(bucket.percentage / histogramMax) * 100}%` }"
          :title="`${bucket.label}: ${formatPercentage(bucket.percentage)}`"
        />
      </div>
      <div class="flex justify-between mt-2 text-xs text-[var(--log-text-muted)]">
        <span>0</span>
        <span>{{ formatTime(stats.totalTime / 2) }}</span>
        <span>{{ formatTime(stats.totalTime) }}</span>
      </div>
    </div>

    <!-- Category Details Table -->
    <div class="chart-card">
      <h3 class="text-sm font-semibold text-[var(--log-text)] mb-4 flex items-center gap-2">
        <UIcon name="i-heroicons-table-cells" class="w-5 h-5 text-[#00DC82]" />
        Category Details
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase border-b border-[var(--log-border)]">
              <th class="py-2 pr-4">Category</th>
              <th class="py-2 pr-4 text-right">Time</th>
              <th class="py-2 pr-4 text-right">%</th>
              <th class="py-2 text-right">Functions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="category in stats.categories"
              :key="category.category"
              class="border-b border-[var(--log-border)]/30"
            >
              <td class="py-2 pr-4">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-sm"
                    :style="{ backgroundColor: category.color }"
                  />
                  <span class="text-sm text-[var(--log-text)]">{{ category.label }}</span>
                </div>
              </td>
              <td class="py-2 pr-4 text-right font-mono text-sm">
                {{ formatTime(category.time) }}
              </td>
              <td class="py-2 pr-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
                {{ formatPercentage(category.percentage) }}
              </td>
              <td class="py-2 text-right font-mono text-sm text-[var(--log-text-muted)]">
                {{ category.count }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  padding: 20px;
}
</style>

