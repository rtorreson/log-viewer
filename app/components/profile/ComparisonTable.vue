<script setup lang="ts">
import type { FunctionDiff, HotFunction } from '~/types/profile'

const props = defineProps<{
  changedFunctions: FunctionDiff[]
  addedFunctions: HotFunction[]
  removedFunctions: HotFunction[]
}>()

const { formatTime, formatPercentage } = useProfileParser()
const { formatDiff, formatDiffPercentage, getDiffColor } = useProfileComparison()

const activeTab = ref<'changed' | 'added' | 'removed'>('changed')

const sortBy = ref<'diff' | 'baseline' | 'comparison'>('diff')
const sortDir = ref<'asc' | 'desc'>('desc')

const sortedChangedFunctions = computed(() => {
  const sorted = [...props.changedFunctions]
  
  sorted.sort((a, b) => {
    let aVal: number, bVal: number
    
    switch (sortBy.value) {
      case 'diff':
        aVal = Math.abs(a.selfTimeDiff)
        bVal = Math.abs(b.selfTimeDiff)
        break
      case 'baseline':
        aVal = a.baselineSelfTime
        bVal = b.baselineSelfTime
        break
      case 'comparison':
        aVal = a.comparisonSelfTime
        bVal = b.comparisonSelfTime
        break
      default:
        aVal = Math.abs(a.selfTimeDiff)
        bVal = Math.abs(b.selfTimeDiff)
    }
    
    return sortDir.value === 'desc' ? bVal - aVal : aVal - bVal
  })
  
  return sorted
})

function toggleSort(column: 'diff' | 'baseline' | 'comparison') {
  if (sortBy.value === column) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = column
    sortDir.value = 'desc'
  }
}

function getDiffIndicator(diff: number): string {
  if (diff > 0) return '↑'
  if (diff < 0) return '↓'
  return '='
}
</script>

<template>
  <div class="comparison-table">
    <!-- Tabs -->
    <div class="flex gap-2 p-3 border-b border-[var(--log-border)]">
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'changed'
          ? 'bg-[#00DC82] text-black'
          : 'bg-[var(--log-surface-2)] text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'changed'"
      >
        <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4" />
        Changed
        <span class="bg-black/20 px-1.5 py-0.5 rounded text-xs">{{ changedFunctions.length }}</span>
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'added'
          ? 'bg-green-500 text-black'
          : 'bg-[var(--log-surface-2)] text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'added'"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
        Added
        <span class="bg-black/20 px-1.5 py-0.5 rounded text-xs">{{ addedFunctions.length }}</span>
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'removed'
          ? 'bg-red-500 text-white'
          : 'bg-[var(--log-surface-2)] text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'removed'"
      >
        <UIcon name="i-heroicons-minus" class="w-4 h-4" />
        Removed
        <span class="bg-black/20 px-1.5 py-0.5 rounded text-xs">{{ removedFunctions.length }}</span>
      </button>
    </div>

    <!-- Changed Functions Table -->
    <div v-if="activeTab === 'changed'" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase tracking-wider border-b border-[var(--log-border)]">
            <th class="py-3 px-4">Function</th>
            <th
              class="py-3 px-4 text-right w-28 cursor-pointer hover:text-[var(--log-text)]"
              @click="toggleSort('baseline')"
            >
              Baseline
              <span v-if="sortBy === 'baseline'" class="ml-1">{{ sortDir === 'desc' ? '↓' : '↑' }}</span>
            </th>
            <th
              class="py-3 px-4 text-right w-28 cursor-pointer hover:text-[var(--log-text)]"
              @click="toggleSort('comparison')"
            >
              Comparison
              <span v-if="sortBy === 'comparison'" class="ml-1">{{ sortDir === 'desc' ? '↓' : '↑' }}</span>
            </th>
            <th
              class="py-3 px-4 text-right w-28 cursor-pointer hover:text-[var(--log-text)]"
              @click="toggleSort('diff')"
            >
              Diff
              <span v-if="sortBy === 'diff'" class="ml-1">{{ sortDir === 'desc' ? '↓' : '↑' }}</span>
            </th>
            <th class="py-3 px-4 text-right w-20">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fn in sortedChangedFunctions"
            :key="fn.name"
            class="border-b border-[var(--log-border)]/30 hover:bg-[var(--log-surface-2)] transition-colors"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <span
                  class="w-6 text-center font-bold"
                  :class="getDiffColor(fn.selfTimeDiff)"
                >
                  {{ getDiffIndicator(fn.selfTimeDiff) }}
                </span>
                <div>
                  <div class="font-mono text-sm text-[var(--log-text)]">{{ fn.name }}</div>
                  <div v-if="fn.callFrame.url" class="text-xs text-[var(--log-text-muted)]">
                    {{ fn.callFrame.url.split('/').pop() }}:{{ fn.callFrame.lineNumber }}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-blue-400">
              {{ formatTime(fn.baselineSelfTime) }}
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-[#00DC82]">
              {{ formatTime(fn.comparisonSelfTime) }}
            </td>
            <td :class="['py-3 px-4 text-right font-mono text-sm font-semibold', getDiffColor(fn.selfTimeDiff)]">
              {{ formatDiff(fn.selfTimeDiff) }}
            </td>
            <td :class="['py-3 px-4 text-right font-mono text-sm', getDiffColor(fn.selfTimeDiff)]">
              {{ formatDiffPercentage(fn.selfTimeDiffPercentage) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="changedFunctions.length === 0" class="p-8 text-center text-[var(--log-text-muted)]">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-3 text-green-400" />
        <p>No significant changes detected</p>
      </div>
    </div>

    <!-- Added Functions Table -->
    <div v-else-if="activeTab === 'added'" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase tracking-wider border-b border-[var(--log-border)]">
            <th class="py-3 px-4">Function</th>
            <th class="py-3 px-4 text-right w-28">Self Time</th>
            <th class="py-3 px-4 text-right w-20">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fn in addedFunctions"
            :key="fn.id"
            class="border-b border-[var(--log-border)]/30 hover:bg-[var(--log-surface-2)] transition-colors"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-green-400" />
                <div>
                  <div class="font-mono text-sm text-[var(--log-text)]">{{ fn.name }}</div>
                  <div v-if="fn.url" class="text-xs text-[var(--log-text-muted)]">
                    {{ fn.url.split('/').pop() }}:{{ fn.line }}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-green-400">
              +{{ formatTime(fn.selfTime) }}
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
              {{ formatPercentage(fn.selfPercentage) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="addedFunctions.length === 0" class="p-8 text-center text-[var(--log-text-muted)]">
        <UIcon name="i-heroicons-document" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No new functions in comparison</p>
      </div>
    </div>

    <!-- Removed Functions Table -->
    <div v-else-if="activeTab === 'removed'" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase tracking-wider border-b border-[var(--log-border)]">
            <th class="py-3 px-4">Function</th>
            <th class="py-3 px-4 text-right w-28">Self Time</th>
            <th class="py-3 px-4 text-right w-20">%</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="fn in removedFunctions"
            :key="fn.id"
            class="border-b border-[var(--log-border)]/30 hover:bg-[var(--log-surface-2)] transition-colors"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-minus-circle" class="w-5 h-5 text-red-400" />
                <div>
                  <div class="font-mono text-sm text-[var(--log-text)]">{{ fn.name }}</div>
                  <div v-if="fn.url" class="text-xs text-[var(--log-text-muted)]">
                    {{ fn.url.split('/').pop() }}:{{ fn.line }}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-red-400">
              -{{ formatTime(fn.selfTime) }}
            </td>
            <td class="py-3 px-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
              {{ formatPercentage(fn.selfPercentage) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="removedFunctions.length === 0" class="p-8 text-center text-[var(--log-text-muted)]">
        <UIcon name="i-heroicons-document" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No functions removed in comparison</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparison-table {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
}
</style>

