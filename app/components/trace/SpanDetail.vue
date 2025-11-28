<script setup lang="ts">
import type { Span } from '~/types/trace'

const { t } = useI18n()

const props = defineProps<{
  span: Span
}>()

const { formatDuration, formatTimestamp, getStatusColor, getServiceColor } = useTraceParser()
const { trace } = useTraceStore()

const activeTab = ref<'info' | 'tags' | 'logs'>('info')
</script>

<template>
  <div class="span-detail">
    <!-- Header -->
    <div class="p-4 border-b border-[var(--log-border)]">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-[var(--log-text)]">{{ span.operationName }}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="inline-block w-2 h-2 rounded-full"
              :style="{ backgroundColor: getServiceColor(span.serviceName, trace?.services || []) }"
            />
            <span class="text-sm text-[var(--log-text-muted)]">{{ span.serviceName }}</span>
          </div>
        </div>
        <div
          class="px-2 py-1 rounded text-xs font-medium"
          :style="{
            backgroundColor: `${getStatusColor(span.status)}20`,
            color: getStatusColor(span.status)
          }"
        >
          {{ span.status }}
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-[var(--log-border)]">
      <button
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'info'
          ? 'text-[#06b6d4] border-b-2 border-[#06b6d4]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'info'"
      >
        {{ t('profiler.functionDetail.info') }}
      </button>
      <button
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'tags'
          ? 'text-[#06b6d4] border-b-2 border-[#06b6d4]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'tags'"
      >
        {{ t('traces.span.tags') }} ({{ Object.keys(span.tags).length }})
      </button>
      <button
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'logs'
          ? 'text-[#06b6d4] border-b-2 border-[#06b6d4]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'logs'"
      >
        {{ t('traces.span.logs') }} ({{ span.logs.length }})
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 overflow-auto max-h-[400px]">
      <!-- Info Tab -->
      <div v-if="activeTab === 'info'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">{{ t('traces.span.duration') }}</div>
            <div class="text-sm font-mono text-[var(--log-text)]">{{ formatDuration(span.duration) }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">{{ t('traces.span.startTime') }}</div>
            <div class="text-sm font-mono text-[var(--log-text)]">{{ formatTimestamp(span.startTime) }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Kind</div>
            <div class="text-sm font-mono text-[var(--log-text)]">{{ span.kind }}</div>
          </div>
          <div>
            <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Span ID</div>
            <div class="text-sm font-mono text-[var(--log-text)] truncate">{{ span.spanId }}</div>
          </div>
        </div>

        <div v-if="span.parentSpanId">
          <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Parent Span ID</div>
          <div class="text-sm font-mono text-[var(--log-text)] truncate">{{ span.parentSpanId }}</div>
        </div>

        <div>
          <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Trace ID</div>
          <div class="text-sm font-mono text-[var(--log-text)] truncate">{{ span.traceId }}</div>
        </div>

        <div v-if="span.warnings && span.warnings.length > 0">
          <div class="text-xs text-[var(--log-text-muted)] uppercase mb-1">Warnings</div>
          <div v-for="warning in span.warnings" :key="warning" class="text-sm text-yellow-400">
            {{ warning }}
          </div>
        </div>
      </div>

      <!-- Tags Tab -->
      <div v-else-if="activeTab === 'tags'" class="space-y-2">
        <div
          v-for="(value, key) in span.tags"
          :key="key"
          class="flex items-start py-2 border-b border-[var(--log-border)]/30"
        >
          <div class="w-1/3 text-sm text-[var(--log-text-muted)] font-mono truncate">{{ key }}</div>
          <div class="w-2/3 text-sm text-[var(--log-text)] font-mono break-all">{{ value }}</div>
        </div>
        <div v-if="Object.keys(span.tags).length === 0" class="text-center text-[var(--log-text-muted)] py-4">
          No tags
        </div>
      </div>

      <!-- Logs Tab -->
      <div v-else-if="activeTab === 'logs'" class="space-y-3">
        <div
          v-for="(log, index) in span.logs"
          :key="index"
          class="p-3 bg-[var(--log-bg)] rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-[var(--log-text)]">{{ log.name }}</span>
            <span class="text-xs text-[var(--log-text-muted)] font-mono">
              {{ formatTimestamp(log.timestamp) }}
            </span>
          </div>
          <div v-if="log.attributes" class="space-y-1">
            <div
              v-for="(value, key) in log.attributes"
              :key="key"
              class="flex text-xs"
            >
              <span class="text-[var(--log-text-muted)] mr-2">{{ key }}:</span>
              <span class="text-[var(--log-text)] font-mono">{{ value }}</span>
            </div>
          </div>
        </div>
        <div v-if="span.logs.length === 0" class="text-center text-[var(--log-text-muted)] py-4">
          No logs
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.span-detail {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
}
</style>

