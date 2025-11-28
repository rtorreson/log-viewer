import type { Trace, Span, TraceStats, TraceFilter, SpanStatus } from '~/types/trace'

export function useTraceStore() {
  const { parseTrace, calculateStats } = useTraceParser()
  
  // State
  const trace = ref<Trace | null>(null)
  const stats = ref<TraceStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const fileName = ref<string>('')
  
  // Selection
  const selectedSpan = ref<Span | null>(null)
  
  // Filters
  const filters = ref<TraceFilter>({
    search: '',
    service: '',
    operation: '',
    status: 'ALL',
    minDuration: 0,
    maxDuration: Infinity
  })

  // Computed
  const hasTrace = computed(() => trace.value !== null)
  
  const services = computed(() => trace.value?.services || [])
  
  const operations = computed(() => {
    if (!trace.value) return []
    const ops = new Set<string>()
    for (const span of trace.value.spans) {
      ops.add(span.operationName)
    }
    return Array.from(ops).sort()
  })
  
  const filteredSpans = computed(() => {
    if (!trace.value) return []
    
    return trace.value.spans.filter(span => {
      // Search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        const matchesOperation = span.operationName.toLowerCase().includes(search)
        const matchesService = span.serviceName.toLowerCase().includes(search)
        const matchesTags = Object.entries(span.tags).some(
          ([key, value]) => 
            key.toLowerCase().includes(search) || 
            String(value).toLowerCase().includes(search)
        )
        if (!matchesOperation && !matchesService && !matchesTags) {
          return false
        }
      }
      
      // Service filter
      if (filters.value.service && span.serviceName !== filters.value.service) {
        return false
      }
      
      // Operation filter
      if (filters.value.operation && span.operationName !== filters.value.operation) {
        return false
      }
      
      // Status filter
      if (filters.value.status !== 'ALL' && span.status !== filters.value.status) {
        return false
      }
      
      // Duration filter
      if (span.duration < filters.value.minDuration) {
        return false
      }
      if (filters.value.maxDuration !== Infinity && span.duration > filters.value.maxDuration) {
        return false
      }
      
      return true
    })
  })

  // Actions
  async function loadFile(file: File): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      const content = await file.text()
      const parsed = parseTrace(content)
      
      trace.value = parsed
      stats.value = calculateStats(parsed)
      fileName.value = file.name
      selectedSpan.value = null
      
      // Reset filters
      filters.value = {
        search: '',
        service: '',
        operation: '',
        status: 'ALL',
        minDuration: 0,
        maxDuration: Infinity
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse trace file'
      trace.value = null
      stats.value = null
    } finally {
      isLoading.value = false
    }
  }

  function selectSpan(span: Span | null): void {
    selectedSpan.value = span
  }

  function setFilter<K extends keyof TraceFilter>(key: K, value: TraceFilter[K]): void {
    filters.value[key] = value
  }

  function resetFilters(): void {
    filters.value = {
      search: '',
      service: '',
      operation: '',
      status: 'ALL',
      minDuration: 0,
      maxDuration: Infinity
    }
  }

  function reset(): void {
    trace.value = null
    stats.value = null
    fileName.value = ''
    error.value = null
    selectedSpan.value = null
    resetFilters()
  }

  // Get span by ID
  function getSpanById(spanId: string): Span | undefined {
    return trace.value?.spans.find(s => s.spanId === spanId)
  }

  // Get parent span
  function getParentSpan(span: Span): Span | undefined {
    if (!span.parentSpanId) return undefined
    return getSpanById(span.parentSpanId)
  }

  // Get child spans
  function getChildSpans(span: Span): Span[] {
    if (!trace.value) return []
    return trace.value.spans.filter(s => s.parentSpanId === span.spanId)
  }

  return {
    // State
    trace: readonly(trace),
    stats: readonly(stats),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fileName: readonly(fileName),
    selectedSpan: readonly(selectedSpan),
    filters: readonly(filters),
    
    // Computed
    hasTrace,
    services,
    operations,
    filteredSpans,
    
    // Actions
    loadFile,
    selectSpan,
    setFilter,
    resetFilters,
    reset,
    getSpanById,
    getParentSpan,
    getChildSpans
  }
}

