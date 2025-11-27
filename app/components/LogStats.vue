<script setup lang="ts">
import type { LogLevel } from '~/types/log'

const { logStats, filteredEntries, logFormat, toggleLevel, filter } = useLogStore()

const levelConfig: Record<LogLevel, { label: string; icon: string; color: string; bg: string }> = {
  error: { label: 'Erros', icon: 'i-heroicons-x-circle', color: 'text-red-400', bg: 'bg-red-500/10' },
  warn: { label: 'Avisos', icon: 'i-heroicons-exclamation-triangle', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  info: { label: 'Info', icon: 'i-heroicons-information-circle', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  debug: { label: 'Debug', icon: 'i-heroicons-bug-ant', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  trace: { label: 'Trace', icon: 'i-heroicons-eye', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  success: { label: 'Success', icon: 'i-heroicons-check-circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  unknown: { label: 'Outros', icon: 'i-heroicons-question-mark-circle', color: 'text-gray-400', bg: 'bg-gray-500/10' },
}

function isLevelActive(level: LogLevel): boolean {
  return filter.value.levels.length === 0 || filter.value.levels.includes(level)
}

function formatFormat(format: string): string {
  const formats: Record<string, string> = {
    json: 'JSON',
    apache: 'Apache',
    nginx: 'Nginx',
    syslog: 'Syslog',
    custom: 'Custom',
    unknown: 'Desconhecido',
  }
  return formats[format] || format
}
</script>

<template>
  <div v-if="logStats" class="flex flex-wrap gap-3 items-center">
    <!-- Total count -->
    <div class="stats-card !p-3 flex items-center gap-2 min-w-[120px]">
      <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-[#00DC82]" />
      <div>
        <div class="text-xs text-[var(--log-text-muted)]">Linhas</div>
        <div class="font-semibold font-mono">{{ filteredEntries.length.toLocaleString() }}</div>
      </div>
    </div>

    <!-- Format badge -->
    <div class="stats-card !p-3 flex items-center gap-2">
      <UIcon name="i-heroicons-code-bracket" class="w-5 h-5 text-[#00DC82]" />
      <div>
        <div class="text-xs text-[var(--log-text-muted)]">Formato</div>
        <div class="font-semibold">{{ formatFormat(logFormat) }}</div>
      </div>
    </div>

    <!-- Level filters -->
    <div class="flex gap-2 ml-auto">
      <button
        v-for="(config, level) in levelConfig"
        :key="level"
        class="stats-card !p-2 px-3 flex items-center gap-2 transition-all"
        :class="[
          isLevelActive(level) ? 'opacity-100' : 'opacity-40',
          logStats.byLevel[level] === 0 ? 'hidden' : ''
        ]"
        @click="toggleLevel(level)"
      >
        <UIcon :name="config.icon" :class="['w-4 h-4', config.color]" />
        <span class="font-mono text-sm font-medium">{{ logStats.byLevel[level] }}</span>
      </button>
    </div>
  </div>
</template>

