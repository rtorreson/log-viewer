<script setup lang="ts">
import type { HotFunction } from '~/types/profile'

const props = defineProps<{
  functions: HotFunction[]
  selectedId?: number
}>()

const emit = defineEmits<{
  select: [fn: HotFunction]
}>()

const { formatTime, formatPercentage } = useProfileParser()

function getPercentageBarWidth(percentage: number): string {
  return `${Math.min(percentage, 100)}%`
}

function getPercentageColor(percentage: number): string {
  if (percentage >= 20) return '#ef4444' // red
  if (percentage >= 10) return '#f97316' // orange
  if (percentage >= 5) return '#eab308' // yellow
  return '#22c55e' // green
}

function truncateUrl(url: string, maxLength: number = 40): string {
  if (!url) return ''
  if (url.length <= maxLength) return url
  
  // Get filename from URL
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  
  if (filename.length <= maxLength) return filename
  return '...' + filename.slice(-maxLength + 3)
}
</script>

<template>
  <div class="hot-functions">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase tracking-wider border-b border-[var(--log-border)]">
            <th class="py-3 px-4">Função</th>
            <th class="py-3 px-4 text-right w-24">Self</th>
            <th class="py-3 px-4 text-right w-24">Total</th>
            <th class="py-3 px-4 w-32">%</th>
            <th class="py-3 px-4 text-right w-20">Hits</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fn in functions"
            :key="fn.id"
            class="border-b border-[var(--log-border)]/30 hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
            :class="{ 'bg-[#00DC82]/10': selectedId === fn.id }"
            @click="emit('select', fn)"
          >
            <td class="py-3 px-4">
              <div class="font-mono text-sm text-[var(--log-text)]">
                {{ fn.name }}
              </div>
              <div v-if="fn.url" class="text-xs text-[var(--log-text-muted)] mt-0.5">
                {{ truncateUrl(fn.url) }}:{{ fn.line }}
              </div>
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm">
              {{ formatTime(fn.selfTime) }}
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
              {{ formatTime(fn.totalTime) }}
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-[var(--log-bg)] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: getPercentageBarWidth(fn.selfPercentage),
                      backgroundColor: getPercentageColor(fn.selfPercentage),
                    }"
                  />
                </div>
                <span class="text-xs font-mono w-14 text-right">
                  {{ formatPercentage(fn.selfPercentage) }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
              {{ fn.hitCount.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-if="functions.length === 0" class="text-center py-12 text-[var(--log-text-muted)]">
      <UIcon name="i-heroicons-funnel" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Nenhuma função encontrada com os filtros atuais</p>
    </div>
  </div>
</template>

<style scoped>
.hot-functions {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
}
</style>

