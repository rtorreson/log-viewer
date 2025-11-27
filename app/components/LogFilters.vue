<script setup lang="ts">
import type { SearchMode } from '~/types/log'

const { filter, setSearch, setSearchMode, toggleCaseSensitive, clearFilters, reset, fileName } = useLogStore()

const searchValue = ref('')
const showAdvanced = ref(false)

const searchModes: { value: SearchMode; label: string; icon: string; description: string }[] = [
  { value: 'contains', label: 'Contém', icon: 'i-heroicons-magnifying-glass', description: 'Busca em qualquer parte do texto' },
  { value: 'exact', label: 'Exato', icon: 'i-heroicons-equals', description: 'Texto deve ser exatamente igual' },
  { value: 'startsWith', label: 'Começa com', icon: 'i-heroicons-arrow-right-start-on-rectangle', description: 'Texto deve começar com o termo' },
  { value: 'endsWith', label: 'Termina com', icon: 'i-heroicons-arrow-right-end-on-rectangle', description: 'Texto deve terminar com o termo' },
  { value: 'regex', label: 'Regex', icon: 'i-heroicons-code-bracket', description: 'Expressão regular (avançado)' },
]

const currentMode = computed(() => {
  return searchModes.find(m => m.value === filter.value.searchMode) || searchModes[0]
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearchInput(value: string) {
  searchValue.value = value
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    setSearch(value)
  }, 150)
}

function handleModeChange(mode: SearchMode) {
  setSearchMode(mode)
  showAdvanced.value = false
}

function handleClear() {
  searchValue.value = ''
  clearFilters()
}

function handleReset() {
  reset()
}

// Sync local search with filter
watch(() => filter.value.search, (newValue) => {
  if (searchValue.value !== newValue) {
    searchValue.value = newValue
  }
})
</script>

<template>
  <div class="flex items-center gap-4 flex-wrap">
    <!-- File info -->
    <div class="flex items-center gap-2 px-4 py-2 bg-[var(--log-surface)] rounded-lg border border-[var(--log-border)]">
      <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-[#00DC82]" />
      <span class="text-sm font-medium truncate max-w-[200px]" :title="fileName">{{ fileName }}</span>
      <button 
        class="ml-2 p-1 hover:bg-[var(--log-surface-2)] rounded transition-colors"
        title="Carregar outro arquivo"
        @click="handleReset"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-[var(--log-text-muted)]" />
      </button>
    </div>

    <!-- Advanced Search -->
    <div class="flex-1 min-w-[400px] max-w-[700px]">
      <div class="flex gap-2">
        <!-- Search Mode Dropdown -->
        <div class="relative">
          <button
            class="flex items-center gap-2 px-3 py-2.5 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg text-sm hover:border-[#00DC82]/50 transition-colors"
            :class="{ 'border-[#00DC82]': showAdvanced }"
            @click="showAdvanced = !showAdvanced"
          >
            <UIcon :name="currentMode.icon" class="w-4 h-4 text-[#00DC82]" />
            <span class="text-[var(--log-text)]">{{ currentMode.label }}</span>
            <UIcon 
              name="i-heroicons-chevron-down" 
              class="w-4 h-4 text-[var(--log-text-muted)] transition-transform"
              :class="{ 'rotate-180': showAdvanced }"
            />
          </button>
          
          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="showAdvanced"
              class="absolute top-full left-0 mt-2 w-64 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg shadow-xl z-50 overflow-hidden"
            >
              <div class="p-2">
                <button
                  v-for="mode in searchModes"
                  :key="mode.value"
                  class="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--log-surface-2)] transition-colors text-left"
                  :class="{ 'bg-[#00DC82]/10': filter.searchMode === mode.value }"
                  @click="handleModeChange(mode.value)"
                >
                  <UIcon 
                    :name="mode.icon" 
                    class="w-5 h-5 mt-0.5"
                    :class="filter.searchMode === mode.value ? 'text-[#00DC82]' : 'text-[var(--log-text-muted)]'"
                  />
                  <div>
                    <div 
                      class="font-medium"
                      :class="filter.searchMode === mode.value ? 'text-[#00DC82]' : 'text-[var(--log-text)]'"
                    >
                      {{ mode.label }}
                    </div>
                    <div class="text-xs text-[var(--log-text-muted)] mt-0.5">
                      {{ mode.description }}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Search Input -->
        <div class="flex-1 relative">
          <UIcon 
            name="i-heroicons-magnifying-glass" 
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--log-text-muted)]" 
          />
          <input
            :value="searchValue"
            type="text"
            :placeholder="filter.searchMode === 'regex' ? 'Expressão regular...' : 'Buscar nos logs...'"
            class="w-full pl-10 pr-24 py-2.5 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg text-[var(--log-text)] placeholder-[var(--log-text-muted)] focus:outline-none focus:border-[#00DC82] focus:ring-1 focus:ring-[#00DC82]/20 font-mono text-sm transition-all"
            @input="handleSearchInput(($event.target as HTMLInputElement).value)"
            @keydown.escape="handleClear"
          />
          
          <!-- Case Sensitive Toggle & Clear -->
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              class="p-1.5 rounded transition-colors"
              :class="filter.caseSensitive ? 'bg-[#00DC82]/20 text-[#00DC82]' : 'hover:bg-[var(--log-surface-2)] text-[var(--log-text-muted)]'"
              :title="filter.caseSensitive ? 'Case Sensitive (ativo)' : 'Case Sensitive (inativo)'"
              @click="toggleCaseSensitive"
            >
              <span class="text-xs font-bold font-mono">Aa</span>
            </button>
            <button
              v-if="searchValue"
              class="p-1.5 hover:bg-[var(--log-surface-2)] rounded transition-colors"
              @click="handleClear"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-[var(--log-text-muted)]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active filter indicators -->
    <div class="flex items-center gap-3">
      <!-- Search mode indicator -->
      <div 
        v-if="filter.searchMode !== 'contains' || filter.caseSensitive"
        class="flex items-center gap-2 text-xs"
      >
        <span 
          v-if="filter.searchMode !== 'contains'"
          class="px-2 py-1 bg-[#00DC82]/20 text-[#00DC82] rounded"
        >
          {{ currentMode.label }}
        </span>
        <span 
          v-if="filter.caseSensitive"
          class="px-2 py-1 bg-amber-500/20 text-amber-400 rounded font-mono"
        >
          Aa
        </span>
      </div>

      <!-- Clear all -->
      <button
        v-if="filter.search || filter.levels.length > 0 || filter.searchMode !== 'contains' || filter.caseSensitive"
        class="text-xs text-[#00DC82] hover:text-[#36e89e] underline underline-offset-2"
        @click="handleClear"
      >
        Limpar filtros
      </button>
    </div>
  </div>

  <!-- Click outside to close dropdown -->
  <div
    v-if="showAdvanced"
    class="fixed inset-0 z-40"
    @click="showAdvanced = false"
  />
</template>
