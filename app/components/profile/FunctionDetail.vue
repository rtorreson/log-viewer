<script setup lang="ts">
import type { HotFunction, CallerInfo, CalleeInfo } from '~/types/profile'

const props = defineProps<{
  func: HotFunction | null
}>()

const emit = defineEmits<{
  close: []
  selectCaller: [caller: CallerInfo]
  selectCallee: [callee: CalleeInfo]
}>()

const { formatTime, formatPercentage, getCategoryColor } = useProfileParser()

const activeTab = ref<'callers' | 'callees' | 'info'>('info')
</script>

<template>
  <div v-if="func" class="function-detail">
    <!-- Header -->
    <div class="flex items-start justify-between p-4 border-b border-[var(--log-border)]">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3">
          <div
            v-if="func.category"
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ backgroundColor: getCategoryColor(func.category) }"
          />
          <h3 class="font-mono text-lg font-semibold text-[var(--log-text)] truncate">
            {{ func.name }}
          </h3>
        </div>
        <p v-if="func.url" class="text-sm text-[var(--log-text-muted)] mt-1 truncate">
          {{ func.url }}:{{ func.line }}
        </p>
      </div>
      <button
        class="p-2 hover:bg-[var(--log-surface-2)] rounded-lg transition-colors flex-shrink-0"
        @click="emit('close')"
      >
        <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-[var(--log-text-muted)]" />
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-4 gap-4 p-4 border-b border-[var(--log-border)]">
      <div>
        <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Self Time</div>
        <div class="font-mono text-lg font-semibold text-[var(--log-text)]">
          {{ formatTime(func.selfTime) }}
        </div>
        <div class="text-xs text-[#00DC82]">{{ formatPercentage(func.selfPercentage) }}</div>
      </div>
      <div>
        <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Total Time</div>
        <div class="font-mono text-lg font-semibold text-[var(--log-text)]">
          {{ formatTime(func.totalTime) }}
        </div>
        <div class="text-xs text-[var(--log-text-muted)]">{{ formatPercentage(func.totalPercentage) }}</div>
      </div>
      <div>
        <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Hit Count</div>
        <div class="font-mono text-lg font-semibold text-[var(--log-text)]">
          {{ func.hitCount.toLocaleString() }}
        </div>
      </div>
      <div>
        <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Category</div>
        <div class="flex items-center gap-2 mt-1">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: getCategoryColor(func.category || 'other') }"
          />
          <span class="text-sm text-[var(--log-text)] capitalize">{{ func.category || 'other' }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-[var(--log-border)]">
      <button
        class="px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'info' ? 'text-[#00DC82] border-b-2 border-[#00DC82]' : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'info'"
      >
        Info
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'callers' ? 'text-[#00DC82] border-b-2 border-[#00DC82]' : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'callers'"
      >
        <UIcon name="i-heroicons-arrow-up" class="w-4 h-4" />
        Callers
        <span class="bg-[var(--log-bg)] px-1.5 py-0.5 rounded text-xs">
          {{ func.callers?.length || 0 }}
        </span>
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
        :class="activeTab === 'callees' ? 'text-[#00DC82] border-b-2 border-[#00DC82]' : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'callees'"
      >
        <UIcon name="i-heroicons-arrow-down" class="w-4 h-4" />
        Callees
        <span class="bg-[var(--log-bg)] px-1.5 py-0.5 rounded text-xs">
          {{ func.callees?.length || 0 }}
        </span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="p-4 max-h-[300px] overflow-y-auto">
      <!-- Info Tab -->
      <div v-if="activeTab === 'info'" class="space-y-4">
        <div>
          <div class="text-xs text-[var(--log-text-muted)] uppercase mb-2">Location</div>
          <div class="bg-[var(--log-bg)] rounded-lg p-3 font-mono text-sm">
            <div class="text-[var(--log-text)]">{{ func.url || '(native)' }}</div>
            <div v-if="func.line >= 0" class="text-[var(--log-text-muted)]">
              Line {{ func.line }}, Column {{ func.callFrame.columnNumber }}
            </div>
          </div>
        </div>

        <div>
          <div class="text-xs text-[var(--log-text-muted)] uppercase mb-2">Call Frame</div>
          <div class="bg-[var(--log-bg)] rounded-lg p-3 font-mono text-xs space-y-1">
            <div><span class="text-[var(--log-text-muted)]">functionName:</span> {{ func.callFrame.functionName }}</div>
            <div><span class="text-[var(--log-text-muted)]">scriptId:</span> {{ func.callFrame.scriptId }}</div>
            <div><span class="text-[var(--log-text-muted)]">lineNumber:</span> {{ func.callFrame.lineNumber }}</div>
            <div><span class="text-[var(--log-text-muted)]">columnNumber:</span> {{ func.callFrame.columnNumber }}</div>
          </div>
        </div>
      </div>

      <!-- Callers Tab -->
      <div v-else-if="activeTab === 'callers'" class="space-y-2">
        <div v-if="!func.callers?.length" class="text-center py-8 text-[var(--log-text-muted)]">
          <UIcon name="i-heroicons-arrow-up" class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No callers found</p>
        </div>
        <div
          v-for="caller in func.callers"
          :key="caller.name"
          class="flex items-center gap-3 p-3 bg-[var(--log-bg)] rounded-lg hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
          @click="emit('selectCaller', caller)"
        >
          <UIcon name="i-heroicons-arrow-up" class="w-4 h-4 text-[var(--log-text-muted)]" />
          <div class="flex-1 min-w-0">
            <div class="font-mono text-sm text-[var(--log-text)] truncate">{{ caller.name }}</div>
            <div v-if="caller.callFrame?.url" class="text-xs text-[var(--log-text-muted)] truncate">
              {{ caller.callFrame.url.split('/').pop() }}
            </div>
          </div>
          <div class="text-right">
            <div class="font-mono text-sm">{{ formatTime(caller.selfTime) }}</div>
            <div class="text-xs text-[var(--log-text-muted)]">{{ formatPercentage(caller.percentage) }}</div>
          </div>
        </div>
      </div>

      <!-- Callees Tab -->
      <div v-else-if="activeTab === 'callees'" class="space-y-2">
        <div v-if="!func.callees?.length" class="text-center py-8 text-[var(--log-text-muted)]">
          <UIcon name="i-heroicons-arrow-down" class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No callees found</p>
        </div>
        <div
          v-for="callee in func.callees"
          :key="callee.name"
          class="flex items-center gap-3 p-3 bg-[var(--log-bg)] rounded-lg hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
          @click="emit('selectCallee', callee)"
        >
          <UIcon name="i-heroicons-arrow-down" class="w-4 h-4 text-[var(--log-text-muted)]" />
          <div class="flex-1 min-w-0">
            <div class="font-mono text-sm text-[var(--log-text)] truncate">{{ callee.name }}</div>
            <div v-if="callee.callFrame?.url" class="text-xs text-[var(--log-text-muted)] truncate">
              {{ callee.callFrame.url.split('/').pop() }}
            </div>
          </div>
          <div class="text-right">
            <div class="font-mono text-sm">{{ formatTime(callee.selfTime) }}</div>
            <div class="text-xs text-[var(--log-text-muted)]">{{ formatPercentage(callee.percentage) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.function-detail {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
}
</style>

