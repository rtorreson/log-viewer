<script setup lang="ts">
import type { ProcessedEntry } from '~/types/network'

const { t } = useI18n()

const props = defineProps<{
  entry: ProcessedEntry
}>()

const { formatBytes, formatTime, getStatusColor, getWaterfallSegments } = useHARParser()

const activeTab = ref<'headers' | 'payload' | 'response' | 'timing'>('headers')

// Format JSON for display
function formatJSON(text: string | undefined): string {
  if (!text) return ''
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}
</script>

<template>
  <div class="request-detail">
    <!-- Header -->
    <div class="p-4 border-b border-[var(--log-border)]">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="px-2 py-0.5 rounded text-xs font-medium"
              :style="{
                backgroundColor: `${getStatusColor(entry.status)}20`,
                color: getStatusColor(entry.status)
              }"
            >
              {{ entry.status }} {{ entry.statusText }}
            </span>
            <span class="text-sm font-medium text-[var(--log-text)]">{{ entry.method }}</span>
          </div>
          <p class="text-sm text-[var(--log-text-muted)] truncate">{{ entry.url }}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-sm font-mono text-[var(--log-text)]">{{ formatTime(entry.time) }}</div>
          <div class="text-xs text-[var(--log-text-muted)]">{{ formatBytes(entry.size) }}</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-[var(--log-border)]">
      <button
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'headers'
          ? 'text-[#ec4899] border-b-2 border-[#ec4899]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'headers'"
      >
        {{ t('network.request.headers') }}
      </button>
      <button
        v-if="entry.postData"
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'payload'
          ? 'text-[#ec4899] border-b-2 border-[#ec4899]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'payload'"
      >
        {{ t('network.request.payload') }}
      </button>
      <button
        v-if="entry.responseContent?.text"
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'response'
          ? 'text-[#ec4899] border-b-2 border-[#ec4899]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'response'"
      >
        {{ t('network.request.response') }}
      </button>
      <button
        class="px-4 py-2 text-sm transition-colors"
        :class="activeTab === 'timing'
          ? 'text-[#ec4899] border-b-2 border-[#ec4899]'
          : 'text-[var(--log-text-muted)] hover:text-[var(--log-text)]'"
        @click="activeTab = 'timing'"
      >
        {{ t('network.request.timing') }}
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 overflow-auto max-h-[400px]">
      <!-- Headers Tab -->
      <div v-if="activeTab === 'headers'" class="space-y-6">
        <!-- Request Headers -->
        <div>
          <h4 class="text-xs text-[var(--log-text-muted)] uppercase mb-2">
            {{ t('network.request.requestHeaders') }}
          </h4>
          <div class="space-y-1">
            <div
              v-for="header in entry.requestHeaders"
              :key="header.name"
              class="flex py-1 border-b border-[var(--log-border)]/30"
            >
              <div class="w-1/3 text-sm text-[var(--log-text-muted)] font-mono truncate">{{ header.name }}</div>
              <div class="w-2/3 text-sm text-[var(--log-text)] font-mono break-all">{{ header.value }}</div>
            </div>
          </div>
        </div>

        <!-- Response Headers -->
        <div>
          <h4 class="text-xs text-[var(--log-text-muted)] uppercase mb-2">
            {{ t('network.request.responseHeaders') }}
          </h4>
          <div class="space-y-1">
            <div
              v-for="header in entry.responseHeaders"
              :key="header.name"
              class="flex py-1 border-b border-[var(--log-border)]/30"
            >
              <div class="w-1/3 text-sm text-[var(--log-text-muted)] font-mono truncate">{{ header.name }}</div>
              <div class="w-2/3 text-sm text-[var(--log-text)] font-mono break-all">{{ header.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payload Tab -->
      <div v-else-if="activeTab === 'payload' && entry.postData">
        <pre class="text-sm font-mono text-[var(--log-text)] whitespace-pre-wrap break-all bg-[var(--log-bg)] p-4 rounded-lg">{{ formatJSON(entry.postData.text) }}</pre>
      </div>

      <!-- Response Tab -->
      <div v-else-if="activeTab === 'response' && entry.responseContent?.text">
        <pre class="text-sm font-mono text-[var(--log-text)] whitespace-pre-wrap break-all bg-[var(--log-bg)] p-4 rounded-lg max-h-64 overflow-auto">{{ formatJSON(entry.responseContent.text) }}</pre>
      </div>

      <!-- Timing Tab -->
      <div v-else-if="activeTab === 'timing'" class="space-y-4">
        <div class="space-y-2">
          <div
            v-for="segment in getWaterfallSegments(entry)"
            :key="segment.name"
            class="flex items-center"
          >
            <div class="w-24 text-sm text-[var(--log-text-muted)]">{{ segment.name }}</div>
            <div class="flex-1 h-4 bg-[var(--log-bg)] rounded relative">
              <div
                class="h-full rounded"
                :style="{
                  width: `${Math.max((segment.duration / entry.time) * 100, 2)}%`,
                  backgroundColor: segment.color
                }"
              />
            </div>
            <div class="w-20 text-right text-sm font-mono text-[var(--log-text-muted)]">
              {{ formatTime(segment.duration) }}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-[var(--log-border)]">
          <div class="flex justify-between text-sm">
            <span class="text-[var(--log-text-muted)]">Total</span>
            <span class="font-mono text-[var(--log-text)]">{{ formatTime(entry.time) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-detail {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
}
</style>

