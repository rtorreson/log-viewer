<script setup lang="ts">
import type { CallTreeNode } from '~/types/profile'

const props = defineProps<{
  data: CallTreeNode | null
  selectedId?: number
}>()

const emit = defineEmits<{
  select: [node: CallTreeNode]
  toggle: [node: CallTreeNode]
}>()

const { formatTime, formatPercentage } = useProfileParser()

function getIndent(depth: number): string {
  return `${depth * 20}px`
}

function flattenTree(node: CallTreeNode | null, result: CallTreeNode[] = []): CallTreeNode[] {
  if (!node) return result
  
  result.push(node)
  
  if (node.expanded && node.children.length > 0) {
    for (const child of node.children) {
      flattenTree(child, result)
    }
  }
  
  return result
}

const flatNodes = computed(() => flattenTree(props.data))

function getPercentageColor(percentage: number): string {
  if (percentage >= 50) return 'text-red-400'
  if (percentage >= 25) return 'text-orange-400'
  if (percentage >= 10) return 'text-yellow-400'
  return 'text-[var(--log-text-muted)]'
}
</script>

<template>
  <div class="call-tree">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-xs text-[var(--log-text-muted)] uppercase tracking-wider border-b border-[var(--log-border)]">
            <th class="py-3 px-4">Função</th>
            <th class="py-3 px-4 text-right w-28">Self Time</th>
            <th class="py-3 px-4 text-right w-28">Total Time</th>
            <th class="py-3 px-4 text-right w-20">Self %</th>
            <th class="py-3 px-4 text-right w-20">Total %</th>
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
                :style="{ paddingLeft: getIndent(node.depth) }"
              >
                <button
                  v-if="node.children.length > 0"
                  class="w-5 h-5 flex items-center justify-center hover:bg-[var(--log-border)] rounded transition-colors"
                  @click.stop="emit('toggle', node)"
                >
                  <UIcon
                    :name="node.expanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    class="w-4 h-4 text-[var(--log-text-muted)]"
                  />
                </button>
                <span v-else class="w-5" />
                
                <span class="font-mono text-sm text-[var(--log-text)]">
                  {{ node.name }}
                </span>
                
                <span v-if="node.children.length > 0" class="text-xs text-[var(--log-text-muted)]">
                  ({{ node.children.length }})
                </span>
              </div>
              
              <div
                v-if="node.callFrame?.url"
                class="text-xs text-[var(--log-text-muted)] mt-0.5"
                :style="{ paddingLeft: `calc(${getIndent(node.depth)} + 28px)` }"
              >
                {{ node.callFrame.url.split('/').pop() }}:{{ node.callFrame.lineNumber }}
              </div>
            </td>
            <td class="py-2 px-4 text-right font-mono text-sm">
              {{ formatTime(node.selfTime) }}
            </td>
            <td class="py-2 px-4 text-right font-mono text-sm">
              {{ formatTime(node.totalTime) }}
            </td>
            <td :class="['py-2 px-4 text-right font-mono text-sm', getPercentageColor(node.selfPercentage)]">
              {{ formatPercentage(node.selfPercentage) }}
            </td>
            <td :class="['py-2 px-4 text-right font-mono text-sm', getPercentageColor(node.totalPercentage)]">
              {{ formatPercentage(node.totalPercentage) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-if="!data" class="text-center py-12 text-[var(--log-text-muted)]">
      <UIcon name="i-heroicons-rectangle-stack" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Nenhum dado de call tree disponível</p>
    </div>
  </div>
</template>

<style scoped>
.call-tree {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
}
</style>

