<script setup lang="ts">
const { t } = useI18n()

const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('fileSelected', files[0])
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    emit('fileSelected', files[0])
  }
}

function openFileDialog() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center p-8">
    <div class="max-w-xl w-full">
      <!-- Dropzone -->
      <div
        class="dropzone"
        :class="{ 'dropzone-active': isDragging }"
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="openFileDialog"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileChange"
        >
        
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#06b6d420] flex items-center justify-center">
            <UIcon name="i-heroicons-arrows-right-left" class="w-10 h-10 text-[#06b6d4]" />
          </div>
          
          <h2 class="text-2xl font-bold text-[var(--log-text)] mb-2">
            {{ t('traces.upload.title') }}
          </h2>
          <p class="text-[var(--log-text-muted)] mb-6">
            {{ t('traces.upload.description') }}
          </p>
          
          <div class="flex items-center justify-center gap-2 text-sm text-[var(--log-text-muted)]">
            <UIcon name="i-heroicons-document" class="w-4 h-4" />
            <span>{{ t('traces.upload.formats') }}</span>
          </div>
        </div>
      </div>

      <!-- Example formats -->
      <div class="mt-8 p-4 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl">
        <h3 class="text-sm font-semibold text-[var(--log-text)] mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-[#06b6d4]" />
          Supported Formats
        </h3>
        <div class="space-y-2 text-sm text-[var(--log-text-muted)]">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-[#00DC82]" />
            <span>OpenTelemetry (OTLP JSON)</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-[#00DC82]" />
            <span>Jaeger JSON Export</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropzone {
  border: 2px dashed var(--log-border);
  border-radius: 16px;
  padding: 48px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--log-surface);
}

.dropzone:hover,
.dropzone-active {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.05);
}
</style>

