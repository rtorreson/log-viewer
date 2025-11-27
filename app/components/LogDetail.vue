<script setup lang="ts">
import type { LogLevel } from '~/types/log'

const { selectedEntry, selectEntry } = useLogStore()

const levelConfig: Record<LogLevel, { label: string; color: string; bg: string }> = {
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/10' },
  warn: { label: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { label: 'Info', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  debug: { label: 'Debug', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  trace: { label: 'Trace', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  success: { label: 'Success', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  unknown: { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

function close() {
  selectEntry(null)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

function formatJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="selectedEntry"
      class="fixed right-0 top-0 h-full w-[500px] bg-[var(--log-surface)] border-l border-[var(--log-border)] shadow-2xl z-50 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-[var(--log-border)]">
        <div class="flex items-center gap-3">
          <span 
            :class="['px-3 py-1 rounded-lg font-mono text-sm font-medium', levelConfig[selectedEntry.level].bg, levelConfig[selectedEntry.level].color]"
          >
            {{ levelConfig[selectedEntry.level].label }}
          </span>
          <span class="text-[var(--log-text-muted)] text-sm">
            Linha {{ selectedEntry.lineNumber }}
          </span>
        </div>
        <button
          class="p-2 hover:bg-[var(--log-surface-2)] rounded-lg transition-colors"
          @click="close"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-[var(--log-text-muted)]" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Timestamp -->
        <div v-if="selectedEntry.timestamp">
          <label class="text-xs text-[var(--log-text-muted)] uppercase tracking-wider">Timestamp</label>
          <div class="mt-1 font-mono text-sm bg-[var(--log-bg)] p-3 rounded-lg">
            {{ selectedEntry.timestamp }}
          </div>
        </div>

        <!-- Source -->
        <div v-if="selectedEntry.source">
          <label class="text-xs text-[var(--log-text-muted)] uppercase tracking-wider">Source</label>
          <div class="mt-1 font-mono text-sm bg-[var(--log-bg)] p-3 rounded-lg text-purple-400">
            {{ selectedEntry.source }}
          </div>
        </div>

        <!-- Message -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-[var(--log-text-muted)] uppercase tracking-wider">Mensagem</label>
            <button
              class="text-xs text-blue-400 hover:text-blue-300"
              @click="copyToClipboard(selectedEntry.message)"
            >
              Copiar
            </button>
          </div>
          <div class="mt-1 font-mono text-sm bg-[var(--log-bg)] p-3 rounded-lg break-all leading-relaxed">
            {{ selectedEntry.message }}
          </div>
        </div>

        <!-- Metadata (JSON) -->
        <div v-if="selectedEntry.metadata">
          <div class="flex items-center justify-between">
            <label class="text-xs text-[var(--log-text-muted)] uppercase tracking-wider">Dados</label>
            <button
              class="text-xs text-blue-400 hover:text-blue-300"
              @click="copyToClipboard(formatJson(selectedEntry.metadata))"
            >
              Copiar JSON
            </button>
          </div>
          <div class="mt-1 font-mono text-xs bg-[var(--log-bg)] p-3 rounded-lg overflow-x-auto">
            <pre class="whitespace-pre-wrap text-[var(--log-text-muted)]">{{ formatJson(selectedEntry.metadata) }}</pre>
          </div>
        </div>

        <!-- Raw line -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-[var(--log-text-muted)] uppercase tracking-wider">Linha Original</label>
            <button
              class="text-xs text-blue-400 hover:text-blue-300"
              @click="copyToClipboard(selectedEntry.rawLine)"
            >
              Copiar
            </button>
          </div>
          <div class="mt-1 font-mono text-xs bg-[var(--log-bg)] p-3 rounded-lg break-all text-[var(--log-text-muted)] leading-relaxed">
            {{ selectedEntry.rawLine }}
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="selectedEntry"
      class="fixed inset-0 bg-black/50 z-40"
      @click="close"
    />
  </Transition>
</template>

