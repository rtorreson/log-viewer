<script setup lang="ts">
const { t } = useI18n()

const tools = computed(() => [
  {
    id: 'logs',
    name: t('tools.logViewer.name'),
    description: t('tools.logViewer.description'),
    icon: 'i-heroicons-document-text',
    features: [
      t('tools.logViewer.features.levels'),
      t('tools.logViewer.features.search'),
      t('tools.logViewer.features.stats'),
      t('tools.logViewer.features.formats'),
    ],
    formats: ['.log', '.txt', 'JSON Lines'],
    route: '/logs',
    color: '#00DC82',
  },
  {
    id: 'profiler',
    name: t('tools.profiler.name'),
    description: t('tools.profiler.description'),
    icon: 'i-heroicons-fire',
    features: [
      t('tools.profiler.features.flameGraph'),
      t('tools.profiler.features.callTree'),
      t('tools.profiler.features.sourceView'),
      t('tools.profiler.features.categories'),
    ],
    formats: ['.cpuprofile', '.json', 'V8 Profile'],
    route: '/profiler',
    color: '#f97316',
  },
  {
    id: 'compare',
    name: t('tools.comparison.name'),
    description: t('tools.comparison.description'),
    icon: 'i-heroicons-scale',
    features: [
      t('tools.comparison.features.diff'),
      t('tools.comparison.features.delta'),
      t('tools.comparison.features.categories'),
      t('tools.comparison.features.regressions'),
    ],
    formats: ['.cpuprofile', '.json', 'V8 Profile'],
    route: '/compare',
    color: '#8b5cf6',
  },
  {
    id: 'traces',
    name: t('tools.traces.name'),
    description: t('tools.traces.description'),
    icon: 'i-heroicons-arrows-right-left',
    features: [
      t('tools.traces.features.waterfall'),
      t('tools.traces.features.serviceMap'),
      t('tools.traces.features.spans'),
      t('tools.traces.features.filters'),
    ],
    formats: ['OpenTelemetry', 'Jaeger', '.json'],
    route: '/traces',
    color: '#06b6d4',
  },
  {
    id: 'network',
    name: t('tools.network.name'),
    description: t('tools.network.description'),
    icon: 'i-heroicons-globe-alt',
    features: [
      t('tools.network.features.waterfall'),
      t('tools.network.features.timing'),
      t('tools.network.features.headers'),
      t('tools.network.features.stats'),
    ],
    formats: ['.har', 'HTTP Archive'],
    route: '/network',
    color: '#ec4899',
  },
])
</script>

<template>
  <div class="min-h-screen bg-[var(--log-bg)] flex flex-col">
    <!-- Header with Language Switcher -->
    <header class="absolute top-0 right-0 p-4 z-10">
      <LanguageSwitcher />
    </header>

    <!-- Hero Section -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <!-- Logo & Title -->
      <div class="text-center mb-16">
        <div class="flex items-center justify-center gap-4 mb-8">
          <OpenWatchLogo :size="72" class="text-[#00DC82]" />
        </div>
        <h1 class="text-5xl md:text-6xl font-bold mb-4">
          <span class="bg-gradient-to-r from-[#00DC82] via-[#36e89e] to-[#00b368] bg-clip-text text-transparent">
            {{ t('home.title') }}
          </span>
        </h1>
        <p class="text-xl text-[var(--log-text-muted)] max-w-2xl mx-auto">
          {{ t('home.subtitle') }}
        </p>
      </div>

      <!-- Tools Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        <NuxtLink
          v-for="tool in tools"
          :key="tool.id"
          :to="tool.route"
          class="tool-card group"
        >
          <div class="tool-card-inner">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
              <div 
                class="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                :style="{ background: `${tool.color}20` }"
              >
                <UIcon 
                  :name="tool.icon" 
                  class="w-8 h-8 transition-colors"
                  :style="{ color: tool.color }"
                />
              </div>
              <UIcon 
                name="i-heroicons-arrow-right" 
                class="w-6 h-6 text-[var(--log-text-muted)] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all"
              />
            </div>

            <!-- Content -->
            <h2 class="text-2xl font-bold text-[var(--log-text)] mb-2 group-hover:text-[#00DC82] transition-colors">
              {{ tool.name }}
            </h2>
            <p class="text-[var(--log-text-muted)] mb-6">
              {{ tool.description }}
            </p>

            <!-- Features -->
            <ul class="space-y-2 mb-6">
              <li 
                v-for="feature in tool.features" 
                :key="feature"
                class="flex items-center gap-2 text-sm text-[var(--log-text-muted)]"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-[#00DC82]" />
                {{ feature }}
              </li>
            </ul>

            <!-- Formats -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="format in tool.formats"
                :key="format"
                class="px-2 py-1 text-xs bg-[var(--log-bg)] rounded-md text-[var(--log-text-muted)]"
              >
                {{ format }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Coming Soon -->
      <div class="mt-16 text-center">
        <p class="text-[var(--log-text-muted)] text-sm mb-4">{{ t('home.comingSoon') }}:</p>
        <div class="flex justify-center gap-4 flex-wrap">
          <div class="coming-soon-badge">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
            Metrics Viewer
          </div>
          <div class="coming-soon-badge">
            <UIcon name="i-heroicons-beaker" class="w-4 h-4" />
            Heap Snapshot
          </div>
          <div class="coming-soon-badge">
            <UIcon name="i-heroicons-document-chart-bar" class="w-4 h-4" />
            Lighthouse Report
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-[var(--log-border)] py-6 px-6">
      <div class="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-2 text-[var(--log-text-muted)] text-sm">
          <UIcon name="i-heroicons-lock-closed" class="w-4 h-4 text-[#00DC82]" />
          <span>{{ t('home.footer.clientSide') }} • {{ t('home.footer.noDataSent') }} • {{ t('home.footer.openSource') }}</span>
        </div>
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/rtorreson/openwatch"
            target="_blank"
            class="flex items-center gap-2 text-[var(--log-text-muted)] hover:text-[#00DC82] transition-colors"
          >
            <UIcon name="i-simple-icons-github" class="w-5 h-5" />
            <span class="text-sm">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tool-card {
  display: block;
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.tool-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(0, 220, 130, 0.06),
    transparent 40%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tool-card:hover::before {
  opacity: 1;
}

.tool-card:hover {
  border-color: rgba(0, 220, 130, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.tool-card-inner {
  position: relative;
  padding: 32px;
}

.coming-soon-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 9999px;
  color: var(--log-text-muted);
  font-size: 14px;
}
</style>
