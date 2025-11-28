<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()

const {
  hasEntries,
  fileName,
  isLoading,
  error,
  selectedEntry,
  loadFile,
  selectEntry,
  reset,
} = useNetworkStore()

async function handleFileSelected(file: File) {
  try {
    await loadFile(file)
  } catch (e) {
    console.error('Error loading HAR:', e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--log-bg)] flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-[var(--log-bg)]/95 backdrop-blur-sm border-b border-[var(--log-border)]">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="p-2 hover:bg-[var(--log-surface)] rounded-lg transition-colors">
            <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 text-[var(--log-text-muted)]" />
          </NuxtLink>
          <UIcon name="i-heroicons-globe-alt" class="w-6 h-6 text-[#ec4899]" />
          <h1 class="text-xl font-semibold bg-gradient-to-r from-[#ec4899] to-[#f472b6] bg-clip-text text-transparent">
            {{ t('network.title') }}
          </h1>
          <span v-if="fileName" class="text-sm text-[var(--log-text-muted)] ml-2">{{ fileName }}</span>

          <div v-if="hasEntries" class="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <button
              class="px-3 py-1.5 text-sm bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg hover:bg-[var(--log-surface-2)] transition-colors"
              @click="reset"
            >
              {{ t('common.reset') }}
            </button>
          </div>
          <div v-else class="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-4 flex-1 flex flex-col">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center flex-1">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-[#ec4899] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p class="text-[var(--log-text)]">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex items-center justify-center flex-1 p-8">
        <div class="text-center max-w-md">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 class="text-xl font-bold text-[var(--log-text)] mb-2">{{ t('common.error') }}</h2>
          <p class="text-[var(--log-text-muted)] mb-4">{{ error }}</p>
          <button
            class="px-4 py-2 bg-[#ec4899] text-white font-medium rounded-lg hover:bg-[#f472b6] transition-colors"
            @click="reset"
          >
            {{ t('common.tryAgain') }}
          </button>
        </div>
      </div>

      <!-- Upload Screen -->
      <NetworkUpload v-else-if="!hasEntries" @file-selected="handleFileSelected" />

      <!-- Network Views -->
      <div v-else class="space-y-6 flex-1 flex flex-col">
        <!-- Stats -->
        <NetworkStats />

        <!-- Filters -->
        <NetworkFilters />

        <!-- Main Content -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
          <!-- Waterfall -->
          <div class="xl:col-span-2">
            <NetworkWaterfall @entry-selected="selectEntry" />
          </div>

          <!-- Request Detail -->
          <div>
            <RequestDetail v-if="selectedEntry" :entry="selectedEntry" />
            <div v-else class="bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl p-6 text-center text-[var(--log-text-muted)]">
              <UIcon name="i-heroicons-information-circle" class="w-10 h-10 mx-auto mb-3" />
              <p>Select a request in the waterfall to see its details here.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

