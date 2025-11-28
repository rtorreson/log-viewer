<script setup lang="ts">
import type { LogEntry, LogLevel } from "~/types/log";

const props = defineProps<{
  entry: LogEntry;
  searchTerm?: string;
}>();

const emit = defineEmits<{
  toggle: [];
  select: [];
}>();

const levelConfig: Record<LogLevel, { label: string; class: string }> = {
  error: { label: "ERR", class: "error" },
  warn: { label: "WRN", class: "warn" },
  info: { label: "INF", class: "info" },
  debug: { label: "DBG", class: "debug" },
  trace: { label: "TRC", class: "trace" },
  success: { label: "OK", class: "success" },
  unknown: { label: "???", class: "trace" },
};

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;

    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  } catch {
    return timestamp;
  }
}

function highlightSearch(text: string, search?: string): string {
  if (!search || !text) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const searchEscaped = escapeHtml(search);
  const regex = new RegExp(`(${escapeRegex(searchEscaped)})`, "gi");

  return escaped.replace(
    regex,
    '<mark class="bg-[#00DC82]/30 text-[#36e89e] rounded px-0.5">$1</mark>'
  );
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatJson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 2);
}
</script>

<template>
  <div
    :class="[
      'log-entry',
      `level-${entry.level}`,
      { 'cursor-pointer': entry.isJson || entry.metadata },
    ]"
    @click="entry.isJson || entry.metadata ? emit('toggle') : emit('select')"
  >
    <div class="flex items-start gap-3">
      <!-- Line number -->
      <span
        class="text-[var(--log-text-muted)] font-mono text-xs w-12 text-right shrink-0 select-none"
      >
        {{ entry.lineNumber }}
      </span>

      <!-- Timestamp -->
      <span v-if="entry.timestamp" class="log-timestamp shrink-0 w-24">
        {{ formatTimestamp(entry.timestamp) }}
      </span>

      <!-- Level badge -->
      <span :class="['level-badge shrink-0', levelConfig[entry.level].class]">
        {{ levelConfig[entry.level].label }}
      </span>

      <!-- Source -->
      <span
        v-if="entry.source"
        class="text-[#00DC82] font-mono text-sm shrink-0 max-w-[150px] truncate"
      >
        {{ entry.source }}
      </span>

      <!-- Message -->
      <span
        class="flex-1 break-all"
        v-html="highlightSearch(entry.message, searchTerm)"
      />

      <!-- Expand indicator for JSON -->
      <button
        v-if="entry.isJson || entry.metadata"
        class="shrink-0 p-1 hover:bg-[var(--log-surface-2)] rounded transition-colors"
      >
        <UIcon
          :name="
            entry.expanded
              ? 'i-heroicons-chevron-up'
              : 'i-heroicons-chevron-down'
          "
          class="w-4 h-4 text-[var(--log-text-muted)]"
        />
      </button>
    </div>

    <!-- Expanded JSON view -->
    <div
      v-if="entry.expanded && entry.metadata"
      class="mt-3 ml-16 p-4 bg-[var(--log-bg)] rounded-lg border border-[var(--log-border)] overflow-x-auto animate-slide-in"
    >
      <pre
        class="text-sm font-mono text-[var(--log-text-muted)] whitespace-pre-wrap"
      ><code>{{ formatJson(entry.metadata) }}</code></pre>
    </div>
  </div>
</template>
