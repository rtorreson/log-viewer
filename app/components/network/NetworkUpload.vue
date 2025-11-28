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
          accept=".har"
          class="hidden"
          @change="handleFileChange"
        >
        
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#ec489920] flex items-center justify-center">
            <UIcon name="i-heroicons-globe-alt" class="w-10 h-10 text-[#ec4899]" />
          </div>
          
          <h2 class="text-2xl font-bold text-[var(--log-text)] mb-2">
            {{ t('network.upload.title') }}
          </h2>
          <p class="text-[var(--log-text-muted)] mb-6">
            {{ t('network.upload.description') }}
          </p>
          
          <div class="flex items-center justify-center gap-2 text-sm text-[var(--log-text-muted)]">
            <UIcon name="i-heroicons-document" class="w-4 h-4" />
            <span>{{ t('network.upload.formats') }}</span>
          </div>
        </div>
      </div>

      <!-- How to export HAR -->
      <div class="mt-8 p-4 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl">
        <h3 class="text-sm font-semibold text-[var(--log-text)] mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-[#ec4899]" />
          How to export HAR file
        </h3>
        <div class="space-y-2 text-sm text-[var(--log-text-muted)]">
          <div class="flex items-start gap-2">
            <span class="font-bold text-[var(--log-text)]">Chrome:</span>
            <span>DevTools → Network → Right-click → Save all as HAR</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="font-bold text-[var(--log-text)]">Firefox:</span>
            <span>DevTools → Network → Gear icon → Save All as HAR</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="font-bold text-[var(--log-text)]">Safari:</span>
            <span>DevTools → Network → Export</span>
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
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.05);
}
</style>

