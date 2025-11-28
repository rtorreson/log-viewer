import type { ProcessedEntry, NetworkStats, NetworkFilter, ResourceType } from '~/types/network'

export function useNetworkStore() {
  const { parseHAR } = useHARParser()
  
  // State
  const entries = ref<ProcessedEntry[]>([])
  const stats = ref<NetworkStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const fileName = ref<string>('')
  
  // Selection
  const selectedEntry = ref<ProcessedEntry | null>(null)
  
  // Filters
  const filters = ref<NetworkFilter>({
    search: '',
    type: 'all',
    status: 'all',
    domain: '',
    minSize: 0,
    maxSize: Infinity
  })

  // Computed
  const hasEntries = computed(() => entries.value.length > 0)
  
  const domains = computed(() => {
    const domainSet = new Set<string>()
    for (const entry of entries.value) {
      domainSet.add(entry.domain)
    }
    return Array.from(domainSet).sort()
  })
  
  const resourceTypes = computed(() => {
    const typeSet = new Set<ResourceType>()
    for (const entry of entries.value) {
      typeSet.add(entry.type)
    }
    return Array.from(typeSet)
  })
  
  const filteredEntries = computed(() => {
    return entries.value.filter(entry => {
      // Search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        const matchesUrl = entry.url.toLowerCase().includes(search)
        const matchesName = entry.name.toLowerCase().includes(search)
        if (!matchesUrl && !matchesName) {
          return false
        }
      }
      
      // Type filter
      if (filters.value.type !== 'all' && entry.type !== filters.value.type) {
        return false
      }
      
      // Status filter
      if (filters.value.status !== 'all') {
        const statusGroup = `${Math.floor(entry.status / 100)}xx`
        if (statusGroup !== filters.value.status) {
          return false
        }
      }
      
      // Domain filter
      if (filters.value.domain && entry.domain !== filters.value.domain) {
        return false
      }
      
      // Size filter
      if (entry.size < filters.value.minSize) {
        return false
      }
      if (filters.value.maxSize !== Infinity && entry.size > filters.value.maxSize) {
        return false
      }
      
      return true
    })
  })

  // Waterfall data
  const waterfallData = computed(() => {
    if (filteredEntries.value.length === 0) return { entries: [], totalTime: 0 }
    
    const totalTime = stats.value?.totalTime || 0
    
    return {
      entries: filteredEntries.value,
      totalTime
    }
  })

  // Actions
  async function loadFile(file: File): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      const content = await file.text()
      const parsed = parseHAR(content)
      
      entries.value = parsed.entries
      stats.value = parsed.stats
      fileName.value = file.name
      selectedEntry.value = null
      
      // Reset filters
      filters.value = {
        search: '',
        type: 'all',
        status: 'all',
        domain: '',
        minSize: 0,
        maxSize: Infinity
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse HAR file'
      entries.value = []
      stats.value = null
    } finally {
      isLoading.value = false
    }
  }

  function selectEntry(entry: ProcessedEntry | null): void {
    selectedEntry.value = entry
  }

  function setFilter<K extends keyof NetworkFilter>(key: K, value: NetworkFilter[K]): void {
    filters.value[key] = value
  }

  function resetFilters(): void {
    filters.value = {
      search: '',
      type: 'all',
      status: 'all',
      domain: '',
      minSize: 0,
      maxSize: Infinity
    }
  }

  function reset(): void {
    entries.value = []
    stats.value = null
    fileName.value = ''
    error.value = null
    selectedEntry.value = null
    resetFilters()
  }

  return {
    // State
    entries: readonly(entries),
    stats: readonly(stats),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fileName: readonly(fileName),
    selectedEntry: readonly(selectedEntry),
    filters: readonly(filters),
    
    // Computed
    hasEntries,
    domains,
    resourceTypes,
    filteredEntries,
    waterfallData,
    
    // Actions
    loadFile,
    selectEntry,
    setFilter,
    resetFilters,
    reset
  }
}

