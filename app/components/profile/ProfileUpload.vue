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
  const validExtensions = ['.cpuprofile', '.json', '.profile']
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  
  if (hasValidExtension || file.type === 'application/json') {
    emit('fileSelected', file)
  } else {
    alert('Por favor, selecione um arquivo de CPU profile (.cpuprofile, .json)')
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
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00DC82] to-[#00b368] flex items-center justify-center">
          <UIcon name="i-heroicons-fire" class="w-10 h-10 text-white" />
        </div>
      </div>
      <h1 class="text-4xl font-bold bg-gradient-to-r from-[#00DC82] via-[#36e89e] to-[#00b368] bg-clip-text text-transparent">
        Profile Viewer
      </h1>
      <p class="text-[var(--log-text-muted)] mt-2 text-lg">
        Visualize e analise CPU profiles de forma interativa
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
        accept=".cpuprofile,.json,.profile,application/json"
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
              :name="isDragging ? 'i-heroicons-arrow-down-tray' : 'i-heroicons-cpu-chip'" 
              class="w-12 h-12 text-[#00DC82] transition-all duration-300"
              :class="{ 'animate-bounce': isDragging }"
            />
          </div>
          <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#00DC82]/20 animate-pulse-glow" />
        </div>

        <div class="text-center">
          <p class="text-xl font-medium text-[var(--log-text)]">
            {{ isDragging ? 'Solte o arquivo aqui' : 'Arraste e solte seu CPU profile' }}
          </p>
          <p class="text-[var(--log-text-muted)] mt-2">
            ou <span class="text-[#00DC82] underline underline-offset-4 hover:text-[#36e89e] transition-colors">clique para selecionar</span>
          </p>
        </div>

        <div class="flex items-center gap-2 text-sm text-[var(--log-text-muted)]">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-[#00DC82]/60" />
          <span>Suporta .cpuprofile e .json (Chrome DevTools, Node.js, V8)</span>
        </div>
      </div>
    </div>

    <!-- Supported formats -->
    <div class="mt-8 text-center">
      <p class="text-sm text-[var(--log-text-muted)] mb-3">Formatos suportados:</p>
      <div class="flex gap-3 justify-center flex-wrap">
        <span class="px-3 py-1 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-full text-xs">
          Chrome DevTools
        </span>
        <span class="px-3 py-1 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-full text-xs">
          Node.js --cpu-prof
        </span>
        <span class="px-3 py-1 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-full text-xs">
          V8 CPU Profile
        </span>
      </div>
    </div>
  </div>
</template>

