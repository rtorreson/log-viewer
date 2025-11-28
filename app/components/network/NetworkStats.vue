<script setup lang="ts">
const { t } = useI18n()

const { stats } = useNetworkStore()
const { formatBytes, formatTime } = useHARParser()
</script>

<template>
  <div v-if="stats" class="grid grid-cols-2 md:grid-cols-5 gap-4">
    <div class="stat-card">
      <div class="stat-icon bg-[#ec489920]">
        <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-[#ec4899]" />
      </div>
      <div>
        <div class="stat-value">{{ stats.totalRequests }}</div>
        <div class="stat-label">{{ t('network.stats.requests') }}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-[#06b6d420]">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-[#06b6d4]" />
      </div>
      <div>
        <div class="stat-value">{{ formatBytes(stats.totalTransferred) }}</div>
        <div class="stat-label">{{ t('network.stats.transferred') }}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-[#00DC8220]">
        <UIcon name="i-heroicons-folder" class="w-5 h-5 text-[#00DC82]" />
      </div>
      <div>
        <div class="stat-value">{{ formatBytes(stats.totalResources) }}</div>
        <div class="stat-label">{{ t('network.stats.resources') }}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon bg-[#f9731620]">
        <UIcon name="i-heroicons-clock" class="w-5 h-5 text-[#f97316]" />
      </div>
      <div>
        <div class="stat-value">{{ formatTime(stats.totalTime) }}</div>
        <div class="stat-label">{{ t('network.stats.loadTime') }}</div>
      </div>
    </div>

    <div v-if="stats.domContentLoaded" class="stat-card">
      <div class="stat-icon bg-[#8b5cf620]">
        <UIcon name="i-heroicons-document" class="w-5 h-5 text-[#8b5cf6]" />
      </div>
      <div>
        <div class="stat-value">{{ formatTime(stats.domContentLoaded) }}</div>
        <div class="stat-label">{{ t('network.stats.domContentLoaded') }}</div>
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

