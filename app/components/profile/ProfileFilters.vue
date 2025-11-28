<script setup lang="ts">
import type { ProfileFilter } from '~/types/profile'

const props = defineProps<{
  filter: ProfileFilter
  fileName: string
}>()

const emit = defineEmits<{
  search: [value: string]
  minPercentage: [value: number]
  toggleIdle: []
  toggleGC: []
  reset: []
}>()

const searchValue = ref(props.filter.search)

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function handleSearchInput(value: string) {
  searchValue.value = value
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    emit('search', value)
  }, 150)
}

function handleClear() {
  searchValue.value = ''
  emit('search', '')
}
</script>

<template>
  <div class="flex items-center gap-4 flex-wrap">
    <!-- File info -->
    <div class="flex items-center gap-2 px-4 py-2 bg-[var(--log-surface)] rounded-lg border border-[var(--log-border)]">
      <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-[#00DC82]" />
      <span class="text-sm font-medium truncate max-w-[200px]" :title="fileName">{{ fileName }}</span>
      <button 
        class="ml-2 p-1 hover:bg-[var(--log-surface-2)] rounded transition-colors"
        title="Carregar outro arquivo"
        @click="emit('reset')"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-[var(--log-text-muted)]" />
      </button>
    </div>

    <!-- Search -->
    <div class="flex-1 min-w-[250px] max-w-[400px]">
      <div class="relative">
        <UIcon 
          name="i-heroicons-magnifying-glass" 
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--log-text-muted)]" 
        />
        <input
          :value="searchValue"
          type="text"
          placeholder="Buscar funções..."
          class="w-full pl-10 pr-10 py-2.5 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg text-[var(--log-text)] placeholder-[var(--log-text-muted)] focus:outline-none focus:border-[#00DC82] focus:ring-1 focus:ring-[#00DC82]/20 font-mono text-sm transition-all"
          @input="handleSearchInput(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="searchValue"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--log-surface-2)] rounded transition-colors"
          @click="handleClear"
        >
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-[var(--log-text-muted)]" />
        </button>
      </div>
    </div>

    <!-- Toggles -->
    <div class="flex items-center gap-2">
      <button
        class="px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
        :class="filter.hideIdle 
          ? 'bg-[#00DC82]/20 text-[#00DC82] border border-[#00DC82]/30' 
          : 'bg-[var(--log-surface)] text-[var(--log-text-muted)] border border-[var(--log-border)]'"
        @click="emit('toggleIdle')"
      >
        <UIcon name="i-heroicons-clock" class="w-4 h-4" />
        Hide Idle
      </button>
      
      <button
        class="px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
        :class="filter.hideGC 
          ? 'bg-[#00DC82]/20 text-[#00DC82] border border-[#00DC82]/30' 
          : 'bg-[var(--log-surface)] text-[var(--log-text-muted)] border border-[var(--log-border)]'"
        @click="emit('toggleGC')"
      >
        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
        Hide GC
      </button>
    </div>

    <!-- Min percentage slider -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-[var(--log-text-muted)]">Min:</span>
      <input
        type="range"
        :value="filter.minPercentage"
        min="0"
        max="10"
        step="0.5"
        class="w-24 accent-[#00DC82]"
        @input="emit('minPercentage', parseFloat(($event.target as HTMLInputElement).value))"
      />
      <span class="text-sm font-mono text-[var(--log-text)] w-12">
        {{ filter.minPercentage.toFixed(1) }}%
      </span>
    </div>
  </div>
</template>

