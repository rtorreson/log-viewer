<script setup lang="ts">
const { t } = useI18n()

const { stats } = useTraceStore()
const { formatDuration } = useTraceParser()
</script>

<template>
  <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="stat-card">
      <div class="stat-icon bg-[#06b6d420]">
        <UIcon name="i-heroicons-clock" class="w-5 h-5 text-[#06b6d4]" />
      </div>
      <div>
        <div class="stat-value">{{ formatDuration(stats.totalDuration) }}</div>
        <div class="stat-label">{{ t('traces.stats.duration') }}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-[#00DC8220]">
        <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5 text-[#00DC82]" />
      </div>
      <div>
        <div class="stat-value">{{ stats.totalSpans }}</div>
        <div class="stat-label">{{ t('traces.stats.spans') }}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-[#8b5cf620]">
        <UIcon name="i-heroicons-server-stack" class="w-5 h-5 text-[#8b5cf6]" />
      </div>
      <div>
        <div class="stat-value">{{ stats.totalServices }}</div>
        <div class="stat-label">{{ t('traces.stats.services') }}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-[#ef444420]">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-[#ef4444]" />
      </div>
      <div>
        <div class="stat-value">{{ stats.errorCount }}</div>
        <div class="stat-label">{{ t('traces.stats.errors') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--log-text);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--log-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>

