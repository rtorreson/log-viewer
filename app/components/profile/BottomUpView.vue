<script setup lang="ts">
import type { BottomUpNode } from '~/types/profile'

const props = defineProps<{
  data: BottomUpNode[]
  selectedId?: string
}>()

const emit = defineEmits<{
  select: [node: BottomUpNode]
  toggle: [node: BottomUpNode]
}>()

const { formatTime, formatPercentage, getCategoryColor } = useProfileParser()

function getIndent(depth: number): string {
  return `${depth * 24}px`
}

// Flatten tree for rendering
function flattenNodes(nodes: BottomUpNode[], depth = 0): Array<BottomUpNode & { renderDepth: number }> {
  const result: Array<BottomUpNode & { renderDepth: number }> = []

  for (const node of nodes) {
    result.push({ ...node, renderDepth: depth })

    if (node.expanded && node.callers.length > 0) {
      result.push(...flattenNodes(node.callers, depth + 1))
    }
  }

  return result
}

const flatNodes = computed(() => flattenNodes(props.data))

function getPercentageColor(percentage: number): string {
  if (percentage >= 20) return 'text-red-400'
  if (percentage >= 10) return 'text-orange-400'
  if (percentage >= 5) return 'text-yellow-400'
  return 'text-[var(--log-text-muted)]'
}

function getBarWidth(percentage: number): string {
  return `${Math.min(percentage * 2, 100)}%`
}
</script>

<template>
  <div class="bottom-up-view">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase tracking-wider border-b border-[var(--log-border)]">
            <th class="py-3 px-4">Function</th>
            <th class="py-3 px-4 text-right w-28">Self Time</th>
            <th class="py-3 px-4 w-40">Self %</th>
            <th class="py-3 px-4 text-right w-28">Total Time</th>
            <th class="py-3 px-4 text-right w-20">Hits</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="node in flatNodes"
            :key="node.id"
            class="border-b border-[var(--log-border)]/30 hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
            :class="{ 'bg-[#00DC82]/10': selectedId === node.id }"
            @click="emit('select', node)"
          >
            <td class="py-2 px-4">
              <div
                class="flex items-center gap-2"
                :style="{ paddingLeft: getIndent(node.renderDepth) }"
              >
                <!-- Expand/Collapse for callers -->
                <button
                  v-if="node.callers.length > 0"
                  class="w-5 h-5 flex items-center justify-center hover:bg-[var(--log-border)] rounded transition-colors"
                  @click.stop="emit('toggle', node)"
                >
                  <UIcon
                    :name="node.expanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    class="w-4 h-4 text-[var(--log-text-muted)]"
                  />
                </button>
                <span v-else class="w-5" />

                <!-- Category indicator -->
                <div
                  v-if="node.category"
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getCategoryColor(node.category) }"
                  :title="node.category"
                />

                <!-- Function name -->
                <span class="font-mono text-sm text-[var(--log-text)]">
                  {{ node.name }}
                </span>

                <!-- Caller count badge -->
                <span v-if="node.callers.length > 0" class="text-xs text-[var(--log-text-muted)] bg-[var(--log-bg)] px-1.5 py-0.5 rounded">
                  {{ node.callers.length }} caller{{ node.callers.length > 1 ? 's' : '' }}
                </span>
              </div>

              <!-- URL/Location -->
              <div
                v-if="node.callFrame?.url"
                class="text-xs text-[var(--log-text-muted)] mt-0.5"
                :style="{ paddingLeft: `calc(${getIndent(node.renderDepth)} + 28px)` }"
              >
                {{ node.callFrame.url.split('/').pop() }}:{{ node.callFrame.lineNumber }}
              </div>
            </td>
            <td class="py-2 px-4 text-right font-mono text-sm">
              {{ formatTime(node.selfTime) }}
            </td>
            <td class="py-2 px-4">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-[var(--log-bg)] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: getBarWidth(node.selfPercentage),
                      backgroundColor: getCategoryColor(node.category || 'other'),
                    }"
                  />
                </div>
                <span :class="['text-xs font-mono w-14 text-right', getPercentageColor(node.selfPercentage)]">
                  {{ formatPercentage(node.selfPercentage) }}
                </span>
              </div>
            </td>
            <td class="py-2 px-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
              {{ formatTime(node.totalTime) }}
            </td>
            <td class="py-2 px-4 text-right font-mono text-sm text-[var(--log-text-muted)]">
              {{ node.hitCount.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-if="data.length === 0" class="text-center py-12 text-[var(--log-text-muted)]">
      <UIcon name="i-heroicons-arrow-up" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>No bottom-up data available</p>
    </div>
  </div>
</template>

<style scoped>
.bottom-up-view {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
  max-height: 600px;
  overflow-y: auto;
}
</style>

