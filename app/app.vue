<script setup lang="ts">
const { hasLogs, loadFile, isLoading } = useLogStore()

async function handleFileSelected(file: File) {
  try {
    await loadFile(file)
  } catch (error) {
    console.error('Erro ao carregar arquivo:', error)
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-[var(--log-bg)]">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-[var(--log-bg)]/95 backdrop-blur-sm border-b border-[var(--log-border)]">
        <div class="container mx-auto px-4 py-3">
          <div v-if="hasLogs" class="space-y-3">
            <LogFilters />
            <LogStats />
          </div>
          <div v-else class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-white" />
            </div>
            <h1 class="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Log Viewer
            </h1>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main class="container mx-auto px-4 py-4">
        <LogUpload v-if="!hasLogs && !isLoading" @file-selected="handleFileSelected" />
        <LogList v-else />
      </main>

      <!-- Detail panel -->
      <LogDetail />
    </div>
  </UApp>
</template>
