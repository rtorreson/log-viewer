<script setup lang="ts">
const { filteredEntries, filter, toggleEntryExpanded, selectEntry, isLoading } = useLogStore()

const containerRef = ref<HTMLElement | null>(null)
const displayCount = ref(200)
const isLoadingMore = ref(false)

const displayedEntries = computed(() => {
  return filteredEntries.value.slice(0, displayCount.value)
})

const hasMore = computed(() => {
  return displayCount.value < filteredEntries.value.length
})

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  
  if (scrollHeight - scrollTop - clientHeight < 200 && hasMore.value && !isLoadingMore.value) {
    loadMore()
  }
}

function loadMore() {
  isLoadingMore.value = true
  requestAnimationFrame(() => {
    displayCount.value = Math.min(displayCount.value + 100, filteredEntries.value.length)
    isLoadingMore.value = false
  })
}

function scrollToTop() {
  containerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToBottom() {
  displayCount.value = filteredEntries.value.length
  nextTick(() => {
    containerRef.value?.scrollTo({ top: containerRef.value.scrollHeight, behavior: 'smooth' })
  })
}

watch(() => filter.value, () => {
  displayCount.value = 200
  containerRef.value?.scrollTo({ top: 0 })
}, { deep: true })

watch(() => filteredEntries.value.length, () => {
  displayCount.value = Math.min(200, filteredEntries.value.length)
})
</script>

<template>
  <div class="relative">
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-[var(--log-bg)]/80 flex items-center justify-center z-10 rounded-xl"
    >
      <div class="flex flex-col items-center gap-4">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-blue-400 animate-spin" />
        <span class="text-[var(--log-text-muted)]">Processando logs...</span>
      </div>
    </div>

    <div
      v-if="!isLoading && filteredEntries.length === 0"
      class="log-container flex items-center justify-center"
    >
      <div class="text-center p-8">
        <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 text-[var(--log-text-muted)] mx-auto mb-4" />
        <h3 class="text-lg font-medium text-[var(--log-text)]">Nenhum log encontrado</h3>
        <p class="text-[var(--log-text-muted)] mt-2">Tente ajustar os filtros de busca</p>
      </div>
    </div>

    <div
      v-else
      ref="containerRef"
      class="log-container"
      @scroll="handleScroll"
    >
      <div class="divide-y divide-[var(--log-border)]/30">
        <LogEntry
          v-for="entry in displayedEntries"
          :key="entry.id"
          :entry="entry"
          :search-term="filter.search"
          @toggle="toggleEntryExpanded(entry)"
          @select="selectEntry(entry)"
        />
      </div>
      
      <div v-if="hasMore" class="py-4 text-center">
        <button
          class="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 mx-auto"
          :disabled="isLoadingMore"
          @click="loadMore"
        >
          <UIcon v-if="isLoadingMore" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
          <span>{{ isLoadingMore ? 'Carregando...' : `Carregar mais (${filteredEntries.length - displayCount} restantes)` }}</span>
        </button>
      </div>
    </div>

    <div class="absolute right-4 bottom-4 flex flex-col gap-2">
      <button
        class="p-2 bg-[var(--log-surface-2)] hover:bg-[var(--log-border)] rounded-lg transition-colors shadow-lg"
        title="Ir para o topo"
        @click="scrollToTop"
      >
        <UIcon name="i-heroicons-chevron-double-up" class="w-5 h-5 text-[var(--log-text-muted)]" />
      </button>
      <button
        class="p-2 bg-[var(--log-surface-2)] hover:bg-[var(--log-border)] rounded-lg transition-colors shadow-lg"
        title="Ir para o final"
        @click="scrollToBottom"
      >
        <UIcon name="i-heroicons-chevron-double-down" class="w-5 h-5 text-[var(--log-text-muted)]" />
      </button>
    </div>

    <div class="absolute left-4 bottom-4 text-xs text-[var(--log-text-muted)] bg-[var(--log-surface-2)] px-3 py-1.5 rounded-lg">
      {{ displayedEntries.length.toLocaleString() }} de {{ filteredEntries.length.toLocaleString() }} logs
    </div>
  </div>
</template>
