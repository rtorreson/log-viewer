<script setup lang="ts">
import type { SourceFile, HotFunction } from '~/types/profile'

const props = defineProps<{
  sourceFiles: Map<string, SourceFile>
  selectedFunction?: HotFunction | null
}>()

const emit = defineEmits<{
  selectFile: [file: SourceFile]
  selectFunction: [fn: HotFunction]
}>()

const { formatTime, formatPercentage } = useProfileParser()

const selectedFile = ref<SourceFile | null>(null)
const searchQuery = ref('')

const sortedFiles = computed(() => {
  const files = Array.from(props.sourceFiles.values())
    .filter(f => f.totalTime > 0)
    .sort((a, b) => b.totalTime - a.totalTime)

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    return files.filter(f =>
      f.fileName.toLowerCase().includes(query) ||
      f.url.toLowerCase().includes(query)
    )
  }

  return files
})

const totalTime = computed(() => {
  return Array.from(props.sourceFiles.values()).reduce((sum, f) => sum + f.totalTime, 0)
})

function selectFile(file: SourceFile) {
  selectedFile.value = file
  emit('selectFile', file)
}

function getHeatColor(percentage: number): string {
  if (percentage >= 10) return 'bg-red-500/30 border-l-red-500'
  if (percentage >= 5) return 'bg-orange-500/20 border-l-orange-500'
  if (percentage >= 1) return 'bg-yellow-500/15 border-l-yellow-500'
  return 'bg-transparent border-l-transparent'
}

// Auto-select file if function is selected
watch(() => props.selectedFunction, (fn) => {
  if (fn?.url) {
    const file = props.sourceFiles.get(fn.url)
    if (file) {
      selectedFile.value = file
    }
  }
}, { immediate: true })
</script>

<template>
  <div class="source-view grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
    <!-- File List -->
    <div class="file-list lg:col-span-1 flex flex-col">
      <div class="p-3 border-b border-[var(--log-border)]">
        <h3 class="text-sm font-semibold text-[var(--log-text)] mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-[#00DC82]" />
          Source Files
        </h3>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search files..."
          class="w-full px-3 py-2 bg-[var(--log-bg)] border border-[var(--log-border)] rounded-lg text-sm text-[var(--log-text)] placeholder-[var(--log-text-muted)] focus:outline-none focus:border-[#00DC82]"
        />
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-for="file in sortedFiles"
          :key="file.url"
          class="p-3 border-b border-[var(--log-border)]/30 hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors"
          :class="{ 'bg-[#00DC82]/10': selectedFile?.url === file.url }"
          @click="selectFile(file)"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="font-mono text-sm text-[var(--log-text)] truncate">
                {{ file.fileName }}
              </div>
              <div class="text-xs text-[var(--log-text-muted)] truncate">
                {{ file.url }}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-mono text-sm text-[var(--log-text)]">
                {{ formatTime(file.totalTime) }}
              </div>
              <div class="text-xs text-[var(--log-text-muted)]">
                {{ formatPercentage((file.totalTime / totalTime) * 100) }}
              </div>
            </div>
          </div>

          <!-- Mini progress bar -->
          <div class="mt-2 h-1 bg-[var(--log-bg)] rounded-full overflow-hidden">
            <div
              class="h-full bg-[#00DC82] rounded-full"
              :style="{ width: `${Math.min((file.totalTime / totalTime) * 100, 100)}%` }"
            />
          </div>
        </div>

        <div v-if="sortedFiles.length === 0" class="p-8 text-center text-[var(--log-text-muted)]">
          <UIcon name="i-heroicons-document-magnifying-glass" class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No source files found</p>
        </div>
      </div>
    </div>

    <!-- Line View -->
    <div class="line-view lg:col-span-2 flex flex-col">
      <div v-if="selectedFile" class="flex-1 flex flex-col">
        <!-- File Header -->
        <div class="p-3 border-b border-[var(--log-border)] flex items-center justify-between">
          <div>
            <h3 class="font-mono text-sm font-semibold text-[var(--log-text)]">
              {{ selectedFile.fileName }}
            </h3>
            <p class="text-xs text-[var(--log-text-muted)]">
              {{ selectedFile.lines.length }} lines with profile data
            </p>
          </div>
          <div class="text-right">
            <div class="font-mono text-sm text-[#00DC82]">
              {{ formatTime(selectedFile.totalTime) }}
            </div>
          </div>
        </div>

        <!-- Lines List -->
        <div class="flex-1 overflow-y-auto font-mono text-sm">
          <div
            v-for="line in selectedFile.lines"
            :key="line.lineNumber"
            class="flex items-center border-l-4 transition-colors"
            :class="[
              getHeatColor(line.selfPercentage),
              selectedFunction?.line === line.lineNumber ? 'ring-1 ring-[#00DC82]' : ''
            ]"
          >
            <!-- Line number -->
            <div class="w-16 px-3 py-1 text-right text-[var(--log-text-muted)] bg-[var(--log-bg)]/50 select-none">
              {{ line.lineNumber }}
            </div>

            <!-- Heat bar -->
            <div class="w-24 px-2 py-1 flex items-center gap-2">
              <div class="flex-1 h-2 bg-[var(--log-bg)] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[#00DC82] rounded-full"
                  :style="{ width: `${Math.min(line.selfPercentage * 5, 100)}%` }"
                />
              </div>
            </div>

            <!-- Self time -->
            <div class="w-24 px-2 py-1 text-right text-[var(--log-text-muted)]">
              {{ line.selfTime > 0 ? formatTime(line.selfTime) : '-' }}
            </div>

            <!-- Percentage -->
            <div class="w-16 px-2 py-1 text-right" :class="line.selfPercentage > 1 ? 'text-[#00DC82]' : 'text-[var(--log-text-muted)]'">
              {{ line.selfPercentage > 0.01 ? formatPercentage(line.selfPercentage) : '-' }}
            </div>

            <!-- Hits -->
            <div class="w-16 px-2 py-1 text-right text-[var(--log-text-muted)]">
              {{ line.hitCount > 0 ? line.hitCount : '-' }}
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="p-2 border-t border-[var(--log-border)] text-xs text-[var(--log-text-muted)] flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span>Heat:</span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 bg-red-500/30 rounded" /> >10%
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 bg-orange-500/20 rounded" /> >5%
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 bg-yellow-500/15 rounded" /> >1%
            </span>
          </div>
          <span>Line | Heat | Time | % | Hits</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex-1 flex items-center justify-center text-[var(--log-text-muted)]">
        <div class="text-center">
          <UIcon name="i-heroicons-code-bracket" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a file to view line-by-line profile</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.source-view {
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  overflow: hidden;
}

.file-list {
  border-right: 1px solid var(--log-border);
}
</style>

