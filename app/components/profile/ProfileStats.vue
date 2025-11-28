<script setup lang="ts">
import type { ProfileStats } from '~/types/profile'

const props = defineProps<{
  stats: ProfileStats | null
  fileName?: string
}>()

const { formatTime, formatPercentage } = useProfileParser()

const statCards = computed(() => {
  if (!props.stats) return []
  
  const totalTime = props.stats.totalTime
  const activeTime = totalTime - (props.stats.idleTime || 0)
  
  return [
    {
      label: 'Tempo Total',
      value: formatTime(totalTime),
      icon: 'i-heroicons-clock',
      color: 'text-blue-400',
    },
    {
      label: 'Tempo Ativo',
      value: formatTime(activeTime),
      subValue: formatPercentage((activeTime / totalTime) * 100),
      icon: 'i-heroicons-bolt',
      color: 'text-[#00DC82]',
    },
    {
      label: 'Samples',
      value: props.stats.totalSamples.toLocaleString(),
      icon: 'i-heroicons-chart-bar',
      color: 'text-purple-400',
    },
    {
      label: 'Nodes',
      value: props.stats.totalNodes.toLocaleString(),
      icon: 'i-heroicons-rectangle-stack',
      color: 'text-amber-400',
    },
  ]
})

const gcStats = computed(() => {
  if (!props.stats?.gcTime) return null
  
  return {
    time: formatTime(props.stats.gcTime),
    percentage: formatPercentage((props.stats.gcTime / props.stats.totalTime) * 100),
  }
})
</script>

<template>
  <div v-if="stats" class="profile-stats">
    <!-- File name -->
    <div v-if="fileName" class="flex items-center gap-2 mb-4 px-1">
      <UIcon name="i-heroicons-document-chart-bar" class="w-5 h-5 text-[#00DC82]" />
      <span class="font-medium text-[var(--log-text)]">{{ fileName }}</span>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="stats-card !p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <UIcon :name="stat.icon" :class="['w-5 h-5', stat.color]" />
          <span class="text-xs text-[var(--log-text-muted)] uppercase tracking-wider">
            {{ stat.label }}
          </span>
        </div>
        <div class="font-mono text-xl font-semibold text-[var(--log-text)]">
          {{ stat.value }}
        </div>
        <div v-if="stat.subValue" class="text-xs text-[var(--log-text-muted)] mt-1">
          {{ stat.subValue }}
        </div>
      </div>
    </div>

    <!-- GC Stats -->
    <div v-if="gcStats" class="mt-4 p-4 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-trash" class="w-5 h-5 text-amber-400" />
        <span class="text-sm text-[var(--log-text-muted)]">Garbage Collection:</span>
        <span class="font-mono text-sm text-[var(--log-text)]">{{ gcStats.time }}</span>
        <span class="text-sm text-[var(--log-text-muted)]">({{ gcStats.percentage }})</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-stats {
  margin-bottom: 24px;
}
</style>

