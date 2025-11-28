<script setup lang="ts">
import type { ProcessedEntry } from '~/types/network'

const emit = defineEmits<{
  entrySelected: [entry: ProcessedEntry]
}>()

const { filteredEntries, waterfallData, selectedEntry, selectEntry } = useNetworkStore()
const { formatBytes, formatTime, getStatusColor, getTypeIcon, getTypeColor, getWaterfallSegments } = useHARParser()

// Calculate scale
const scale = computed(() => {
  if (waterfallData.value.totalTime === 0) return 1
  return 100 / waterfallData.value.totalTime
})

function handleEntryClick(entry: ProcessedEntry) {
  selectEntry(entry)
  emit('entrySelected', entry)
}
</script>

<template>
  <div class="network-waterfall overflow-auto">
    <div class="min-w-[900px]">
      <!-- Header -->
      <div class="waterfall-header grid grid-cols-12 gap-2 px-4 py-2 border-b border-[var(--log-border)] text-xs text-[var(--log-text-muted)] uppercase tracking-wider">
        <div class="col-span-4">Name</div>
        <div class="col-span-1 text-center">Status</div>
        <div class="col-span-1 text-center">Type</div>
        <div class="col-span-1 text-right">Size</div>
        <div class="col-span-1 text-right">Time</div>
        <div class="col-span-4">Waterfall</div>
      </div>

      <!-- Entries -->
      <div class="entries-container">
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="entry-row grid grid-cols-12 gap-2 px-4 py-2 items-center hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
          :class="{ 'bg-[var(--log-surface-2)]': selectedEntry?.id === entry.id }"
          @click="handleEntryClick(entry)"
        >
          <!-- Name -->
          <div class="col-span-4 flex items-center gap-2 min-w-0">
            <UIcon
              :name="getTypeIcon(entry.type)"
              class="w-4 h-4 flex-shrink-0"
              :style="{ color: getTypeColor(entry.type) }"
            />
            <span class="text-sm text-[var(--log-text)] truncate">{{ entry.name }}</span>
          </div>

          <!-- Status -->
          <div class="col-span-1 text-center">
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :style="{
                backgroundColor: `${getStatusColor(entry.status)}20`,
                color: getStatusColor(entry.status)
              }"
            >
              {{ entry.status }}
            </span>
          </div>

          <!-- Type -->
          <div class="col-span-1 text-center">
            <span class="text-xs text-[var(--log-text-muted)]">{{ entry.type }}</span>
          </div>

          <!-- Size -->
          <div class="col-span-1 text-right">
            <span class="text-sm font-mono text-[var(--log-text-muted)]">
              {{ formatBytes(entry.size) }}
            </span>
          </div>

          <!-- Time -->
          <div class="col-span-1 text-right">
            <span class="text-sm font-mono text-[var(--log-text-muted)]">
              {{ formatTime(entry.time) }}
            </span>
          </div>

          <!-- Waterfall bar -->
          <div class="col-span-4 h-4 relative">
            <div
              v-for="segment in getWaterfallSegments(entry)"
              :key="segment.name"
              class="absolute h-3 rounded-sm"
              :style="{
                left: `${(entry.startOffset + segment.start) * scale}%`,
                width: `${Math.max(segment.duration * scale, 0.3)}%`,
                backgroundColor: segment.color
              }"
              :title="`${segment.name}: ${formatTime(segment.duration)}`"
            />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredEntries.length === 0" class="p-8 text-center text-[var(--log-text-muted)]">
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No requests match your filters</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-waterfall {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  min-height: 400px;
}

.waterfall-header {
  background: var(--log-bg);
  position: sticky;
  top: 0;
  z-index: 10;
}

.entry-row:not(:last-child) {
  border-bottom: 1px solid var(--log-border);
  border-opacity: 0.3;
}
</style>

