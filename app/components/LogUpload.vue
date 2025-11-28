<script setup lang="ts">
const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function processFile(file: File) {
  if (file.name.endsWith('.log') || file.name.endsWith('.txt') || file.type === 'text/plain' || file.type === '') {
    emit('fileSelected', file)
  } else {
    alert('Por favor, selecione um arquivo .log ou .txt')
  }
}

function openFileDialog() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] p-8">
    <!-- Logo/Header -->
    <div class="mb-12 text-center">
      <div class="flex items-center justify-center gap-4 mb-6">
        <LogIcon :size="80" class="text-[#00DC82]" />
      </div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-[#00DC82] via-[#36e89e] to-[#00b368] bg-clip-text text-transparent">
        Log Viewer
      </h1>
      <p class="text-[var(--log-text-muted)] mt-2 text-lg">
        Visualize e analise seus logs de forma simples
      </p>
    </div>

    <!-- Upload Zone -->
    <div
      class="dropzone w-full max-w-2xl p-12 cursor-pointer"
      :class="{ 'active': isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="openFileDialog"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".log,.txt,text/plain"
        class="hidden"
        @change="handleFileSelect"
      />
      
      <div class="flex flex-col items-center gap-6">
        <div class="relative">
          <div 
            class="w-24 h-24 rounded-full bg-[var(--log-surface-2)] flex items-center justify-center"
            :class="{ 'glow-primary': isDragging }"
          >
            <UIcon 
              :name="isDragging ? 'i-heroicons-arrow-down-tray' : 'i-heroicons-cloud-arrow-up'" 
              class="w-12 h-12 text-[#00DC82] transition-all duration-300"
              :class="{ 'animate-bounce': isDragging }"
            />
          </div>
          <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#00DC82]/20 animate-pulse-glow" />
          <div class="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-[#00DC82]/10 animate-pulse-glow" style="animation-delay: 0.5s" />
        </div>

        <div class="text-center">
          <p class="text-xl font-medium text-[var(--log-text)]">
            {{ isDragging ? 'Solte o arquivo aqui' : 'Arraste e solte seu arquivo de log' }}
          </p>
          <p class="text-[var(--log-text-muted)] mt-2">
            ou <span class="text-[#00DC82] underline underline-offset-4 hover:text-[#36e89e] transition-colors">clique para selecionar</span>
          </p>
        </div>

        <div class="flex items-center gap-2 text-sm text-[var(--log-text-muted)]">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-[#00DC82]/60" />
          <span>Suporta arquivos .log e .txt</span>
        </div>
      </div>
    </div>

  </div>
</template>

