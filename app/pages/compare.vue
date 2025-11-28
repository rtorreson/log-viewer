<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const {
  hasComparison,
  hasBaseline,
  baselineFileName,
  comparisonFileName,
  isLoading,
  error,
  diff,
  categoryComparison,
  statsComparison,
  topRegressions,
  topImprovements,
  loadBaselineFile,
  loadComparisonFile,
  swapProfiles,
  reset,
} = useProfileComparison()

const { formatTime, formatPercentage } = useProfileParser()

async function handleBaselineSelected(file: File) {
  try {
    await loadBaselineFile(file)
  } catch (e) {
    console.error('Error loading baseline:', e)
  }
}

async function handleComparisonSelected(file: File) {
  try {
    await loadComparisonFile(file)
  } catch (e) {
    console.error('Error loading comparison:', e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--log-bg)]">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-[var(--log-bg)]/95 backdrop-blur-sm border-b border-[var(--log-border)]">
      <div class="container mx-auto px-4 py-3 flex items-center gap-3">
        <NuxtLink to="/" class="p-2 hover:bg-[var(--log-surface)] rounded-lg transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 text-[var(--log-text-muted)]" />
        </NuxtLink>
        <UIcon name="i-heroicons-scale" class="w-6 h-6 text-[#00DC82]" />
        <h1 class="text-xl font-semibold bg-gradient-to-r from-[#00DC82] to-[#36e89e] bg-clip-text text-transparent">
          Profile Comparison
        </h1>

        <div v-if="hasComparison" class="ml-auto flex items-center gap-2">
          <button
            class="px-3 py-1.5 text-sm bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg hover:bg-[var(--log-surface-2)] transition-colors flex items-center gap-2"
            @click="swapProfiles"
          >
            <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4" />
            Swap
          </button>
          <button
            class="px-3 py-1.5 text-sm bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg hover:bg-[var(--log-surface-2)] transition-colors"
            @click="reset"
          >
            Reset
          </button>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-[#00DC82] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p class="text-[var(--log-text)]">Processing profile...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[60vh] p-8">
      <div class="text-center max-w-md">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 class="text-xl font-bold text-[var(--log-text)] mb-2">Error</h2>
        <p class="text-[var(--log-text-muted)] mb-4">{{ error }}</p>
        <button
          class="px-4 py-2 bg-[#00DC82] text-black font-medium rounded-lg hover:bg-[#36e89e] transition-colors"
          @click="reset"
        >
          Try again
        </button>
      </div>
    </div>

    <!-- Upload Screen -->
    <ProfileComparisonUpload
      v-else-if="!hasComparison"
      :has-baseline="hasBaseline"
      :has-comparison="hasComparison"
      :baseline-file-name="baselineFileName"
      :comparison-file-name="comparisonFileName"
      @baseline-selected="handleBaselineSelected"
      @comparison-selected="handleComparisonSelected"
      @swap="swapProfiles"
      @reset="reset"
    />

    <!-- Comparison Results -->
    <div v-else class="container mx-auto px-4 py-6 space-y-6">
      <!-- Summary -->
      <ProfileComparisonSummary
        :stats-comparison="statsComparison"
        :baseline-file-name="baselineFileName"
        :comparison-file-name="comparisonFileName"
        :regressions-count="topRegressions.length"
        :improvements-count="topImprovements.length"
      />

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Left: Tables -->
        <div class="xl:col-span-2 space-y-6">
          <!-- Top Regressions -->
          <div v-if="topRegressions.length > 0" class="bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl p-4">
            <h3 class="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
              Top Regressions (Slower)
            </h3>
            <div class="space-y-2">
              <div
                v-for="fn in topRegressions.slice(0, 5)"
                :key="fn.name"
                class="flex items-center justify-between p-3 bg-red-500/5 rounded-lg"
              >
                <div>
                  <div class="font-mono text-sm text-[var(--log-text)]">{{ fn.name }}</div>
                  <div v-if="fn.callFrame.url" class="text-xs text-[var(--log-text-muted)]">
                    {{ fn.callFrame.url.split('/').pop() }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-mono text-sm font-semibold text-red-400">
                    +{{ formatTime(fn.selfTimeDiff) }}
                  </div>
                  <div class="text-xs text-red-400/70">
                    +{{ fn.selfTimeDiffPercentage.toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Improvements -->
          <div v-if="topImprovements.length > 0" class="bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl p-4">
            <h3 class="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5" />
              Top Improvements (Faster)
            </h3>
            <div class="space-y-2">
              <div
                v-for="fn in topImprovements.slice(0, 5)"
                :key="fn.name"
                class="flex items-center justify-between p-3 bg-green-500/5 rounded-lg"
              >
                <div>
                  <div class="font-mono text-sm text-[var(--log-text)]">{{ fn.name }}</div>
                  <div v-if="fn.callFrame.url" class="text-xs text-[var(--log-text-muted)]">
                    {{ fn.callFrame.url.split('/').pop() }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-mono text-sm font-semibold text-green-400">
                    {{ formatTime(fn.selfTimeDiff) }}
                  </div>
                  <div class="text-xs text-green-400/70">
                    {{ fn.selfTimeDiffPercentage.toFixed(1) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Full Comparison Table -->
          <ProfileComparisonTable
            v-if="diff"
            :changed-functions="diff.changedFunctions"
            :added-functions="diff.addedFunctions"
            :removed-functions="diff.removedFunctions"
          />
        </div>

        <!-- Right: Categories -->
        <div>
          <ProfileComparisonCategories
            :categories="categoryComparison"
          />
        </div>
      </div>
    </div>
  </div>
</template>

