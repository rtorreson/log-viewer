<script setup lang="ts">
const props = defineProps<{
  hasBaseline: boolean
  hasComparison: boolean
  baselineFileName?: string
  comparisonFileName?: string
}>()

const emit = defineEmits<{
  baselineSelected: [file: File]
  comparisonSelected: [file: File]
  swap: []
  reset: []
}>()

const baselineInput = ref<HTMLInputElement | null>(null)
const comparisonInput = ref<HTMLInputElement | null>(null)

const isDraggingBaseline = ref(false)
const isDraggingComparison = ref(false)

function handleDrop(event: DragEvent, type: 'baseline' | 'comparison') {
  event.preventDefault()
  isDraggingBaseline.value = false
  isDraggingComparison.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0], type)
  }
}

function handleFileSelect(event: Event, type: 'baseline' | 'comparison') {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    processFile(files[0], type)
  }
}

function processFile(file: File, type: 'baseline' | 'comparison') {
  const validExtensions = ['.cpuprofile', '.json', '.profile']
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

  if (hasValidExtension || file.type === 'application/json') {
    if (type === 'baseline') {
      emit('baselineSelected', file)
    } else {
      emit('comparisonSelected', file)
    }
  } else {
    alert('Please select a CPU profile file (.cpuprofile, .json)')
  }
}
</script>

<template>
  <div class="comparison-upload">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex items-center justify-center gap-3 mb-4">
        <UIcon name="i-heroicons-scale" class="w-12 h-12 text-[#00DC82]" />
      </div>
      <h2 class="text-2xl font-bold text-[var(--log-text)]">Profile Comparison</h2>
      <p class="text-[var(--log-text-muted)] mt-2">
        Compare two CPU profiles to identify performance regressions and improvements
      </p>
    </div>

    <!-- Upload Zones -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <!-- Baseline Profile -->
      <div
        class="upload-zone"
        :class="{
          'active': isDraggingBaseline,
          'has-file': hasBaseline,
        }"
        @dragover.prevent="isDraggingBaseline = true"
        @dragleave="isDraggingBaseline = false"
        @drop="handleDrop($event, 'baseline')"
        @click="baselineInput?.click()"
      >
        <input
          ref="baselineInput"
          type="file"
          accept=".cpuprofile,.json,.profile,application/json"
          class="hidden"
          @change="handleFileSelect($event, 'baseline')"
        />

        <div class="flex flex-col items-center gap-4">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center"
            :class="hasBaseline ? 'bg-blue-500/20' : 'bg-[var(--log-surface-2)]'"
          >
            <UIcon
              :name="hasBaseline ? 'i-heroicons-check' : 'i-heroicons-document-arrow-up'"
              :class="hasBaseline ? 'text-blue-400' : 'text-[var(--log-text-muted)]'"
              class="w-8 h-8"
            />
          </div>

          <div class="text-center">
            <div class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-1">
              Baseline
            </div>
            <div v-if="hasBaseline" class="text-[var(--log-text)] font-mono text-sm truncate max-w-[200px]">
              {{ baselineFileName }}
            </div>
            <div v-else class="text-[var(--log-text-muted)] text-sm">
              Drop or click to select
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Profile -->
      <div
        class="upload-zone"
        :class="{
          'active': isDraggingComparison,
          'has-file': hasComparison,
          'disabled': !hasBaseline,
        }"
        @dragover.prevent="isDraggingComparison = true"
        @dragleave="isDraggingComparison = false"
        @drop="handleDrop($event, 'comparison')"
        @click="hasBaseline && comparisonInput?.click()"
      >
        <input
          ref="comparisonInput"
          type="file"
          accept=".cpuprofile,.json,.profile,application/json"
          class="hidden"
          :disabled="!hasBaseline"
          @change="handleFileSelect($event, 'comparison')"
        />

        <div class="flex flex-col items-center gap-4">
          <div
            class="w-16 h-16 rounded-full flex items-center justify-center"
            :class="hasComparison ? 'bg-[#00DC82]/20' : 'bg-[var(--log-surface-2)]'"
          >
            <UIcon
              :name="hasComparison ? 'i-heroicons-check' : 'i-heroicons-document-arrow-up'"
              :class="hasComparison ? 'text-[#00DC82]' : 'text-[var(--log-text-muted)]'"
              class="w-8 h-8"
            />
          </div>

          <div class="text-center">
            <div class="text-sm font-semibold text-[#00DC82] uppercase tracking-wider mb-1">
              Comparison
            </div>
            <div v-if="hasComparison" class="text-[var(--log-text)] font-mono text-sm truncate max-w-[200px]">
              {{ comparisonFileName }}
            </div>
            <div v-else-if="hasBaseline" class="text-[var(--log-text-muted)] text-sm">
              Drop or click to select
            </div>
            <div v-else class="text-[var(--log-text-muted)] text-sm opacity-50">
              Load baseline first
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Arrow between zones -->
    <div v-if="hasBaseline && hasComparison" class="flex justify-center my-6">
      <button
        class="p-3 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-full hover:bg-[var(--log-surface-2)] transition-colors"
        title="Swap profiles"
        @click="emit('swap')"
      >
        <UIcon name="i-heroicons-arrows-right-left" class="w-5 h-5 text-[var(--log-text-muted)]" />
      </button>
    </div>

    <!-- Actions -->
    <div v-if="hasBaseline" class="flex justify-center gap-4 mt-6">
      <button
        class="px-4 py-2 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg text-[var(--log-text-muted)] hover:text-[var(--log-text)] hover:bg-[var(--log-surface-2)] transition-colors"
        @click="emit('reset')"
      >
        Reset
      </button>
    </div>

    <!-- Tips -->
    <div class="mt-8 text-center text-sm text-[var(--log-text-muted)]">
      <p class="mb-2">💡 Tips:</p>
      <ul class="space-y-1">
        <li>• Use <strong>Baseline</strong> for the "before" profile (original/older version)</li>
        <li>• Use <strong>Comparison</strong> for the "after" profile (new/optimized version)</li>
        <li>• Green = improvement (faster), Red = regression (slower)</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.comparison-upload {
  padding: 48px 24px;
}

.upload-zone {
  padding: 32px;
  border: 2px dashed var(--log-border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--log-surface);
}

.upload-zone:hover:not(.disabled) {
  border-color: var(--log-text-muted);
  background: var(--log-surface-2);
}

.upload-zone.active {
  border-color: #00DC82;
  background: rgba(0, 220, 130, 0.05);
}

.upload-zone.has-file {
  border-style: solid;
  border-color: var(--log-border);
}

.upload-zone.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

