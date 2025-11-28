<script setup lang="ts">
import type { Span } from '~/types/trace'

const emit = defineEmits<{
  spanSelected: [span: Span]
}>()

const { trace, filteredSpans, selectedSpan, selectSpan } = useTraceStore()
const { formatDuration, getServiceColor, getStatusColor } = useTraceParser()

const containerRef = ref<HTMLElement | null>(null)

// Calculate scale factor
const scale = computed(() => {
  if (!trace.value || trace.value.duration === 0) return 1
  return 100 / trace.value.duration
})

// Get span left position
function getSpanLeft(span: Span): number {
  if (!trace.value) return 0
  return (span.startTime - trace.value.startTime) * scale.value
}

// Get span width
function getSpanWidth(span: Span): number {
  const width = span.duration * scale.value
  return Math.max(width, 0.5) // Minimum width for visibility
}

// Handle span click
function handleSpanClick(span: Span) {
  selectSpan(span)
  emit('spanSelected', span)
}
</script>

<template>
  <div ref="containerRef" class="trace-timeline overflow-auto">
    <div v-if="trace" class="min-w-[800px]">
      <!-- Timeline header -->
      <div class="timeline-header flex items-center justify-between px-4 py-2 border-b border-[var(--log-border)] text-xs text-[var(--log-text-muted)]">
        <span>0μs</span>
        <span>{{ formatDuration(trace.duration / 4) }}</span>
        <span>{{ formatDuration(trace.duration / 2) }}</span>
        <span>{{ formatDuration((trace.duration * 3) / 4) }}</span>
        <span>{{ formatDuration(trace.duration) }}</span>
      </div>

      <!-- Spans -->
      <div class="spans-container">
        <div
          v-for="span in filteredSpans"
          :key="span.spanId"
          class="span-row flex items-center py-1 px-2 hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
          :class="{ 'bg-[var(--log-surface-2)]': selectedSpan?.spanId === span.spanId }"
          :style="{ paddingLeft: `${(span.depth || 0) * 16 + 8}px` }"
          @click="handleSpanClick(span)"
        >
          <!-- Service & Operation -->
          <div class="w-64 flex-shrink-0 pr-4 truncate">
            <span
              class="inline-block w-2 h-2 rounded-full mr-2"
              :style="{ backgroundColor: getServiceColor(span.serviceName, trace.services) }"
            />
            <span class="text-sm text-[var(--log-text)]">{{ span.operationName }}</span>
            <span class="text-xs text-[var(--log-text-muted)] ml-2">{{ span.serviceName }}</span>
          </div>

          <!-- Timeline bar -->
          <div class="flex-1 h-6 relative">
            <div
              class="absolute h-5 rounded transition-all hover:h-6"
              :style="{
                left: `${getSpanLeft(span)}%`,
                width: `${getSpanWidth(span)}%`,
                backgroundColor: getServiceColor(span.serviceName, trace.services),
                opacity: span.status === 'ERROR' ? 1 : 0.8
              }"
            >
              <!-- Error indicator -->
              <div
                v-if="span.status === 'ERROR'"
                class="absolute inset-0 rounded"
                style="background: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239, 68, 68, 0.3) 2px, rgba(239, 68, 68, 0.3) 4px)"
              />
            </div>
          </div>

          <!-- Duration -->
          <div class="w-24 flex-shrink-0 text-right text-sm font-mono text-[var(--log-text-muted)]">
            {{ formatDuration(span.duration) }}
          </div>

          <!-- Status -->
          <div class="w-8 flex-shrink-0 flex justify-center">
            <div
              class="w-2 h-2 rounded-full"
              :style="{ backgroundColor: getStatusColor(span.status) }"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredSpans.length === 0" class="p-8 text-center text-[var(--log-text-muted)]">
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No spans match your filters</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trace-timeline {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  min-height: 400px;
}

.timeline-header {
  background: var(--log-bg);
  position: sticky;
  top: 0;
  z-index: 10;
}

.spans-container {
  min-height: 300px;
}

.span-row:not(:last-child) {
  border-bottom: 1px solid var(--log-border);
  border-opacity: 0.3;
}
</style>

