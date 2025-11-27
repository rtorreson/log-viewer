import type { LogEntry, LogFilter, LogStats, ParsedLog, LogLevel, SearchMode } from '~/types/log'

const logEntries = ref<LogEntry[]>([])
const logStats = ref<LogStats | null>(null)
const logFormat = ref<ParsedLog['format']>('unknown')
const fileName = ref<string>('')
const isLoading = ref(false)
const filter = ref<LogFilter>({
  search: '',
  searchMode: 'contains',
  caseSensitive: false,
  levels: [],
})
const selectedEntry = ref<LogEntry | null>(null)

export function useLogStore() {
  const { parse } = useLogParser()

  // Advanced search matching function
  function matchesSearch(text: string, search: string, mode: SearchMode, caseSensitive: boolean): boolean {
    if (!search) return true
    
    const searchText = caseSensitive ? search : search.toLowerCase()
    const targetText = caseSensitive ? text : text.toLowerCase()
    
    switch (mode) {
      case 'exact':
        return targetText === searchText
      case 'startsWith':
        return targetText.startsWith(searchText)
      case 'endsWith':
        return targetText.endsWith(searchText)
      case 'regex':
        try {
          const flags = caseSensitive ? 'g' : 'gi'
          const regex = new RegExp(search, flags)
          return regex.test(text)
        } catch {
          // Invalid regex, fall back to contains
          return targetText.includes(searchText)
        }
      case 'contains':
      default:
        return targetText.includes(searchText)
    }
  }

  const filteredEntries = computed(() => {
    let entries = logEntries.value

    // Filter by search term with advanced modes
    if (filter.value.search) {
      const { search, searchMode, caseSensitive } = filter.value
      entries = entries.filter(entry => 
        matchesSearch(entry.message, search, searchMode, caseSensitive) ||
        matchesSearch(entry.rawLine, search, searchMode, caseSensitive) ||
        (entry.source && matchesSearch(entry.source, search, searchMode, caseSensitive))
      )
    }

    // Filter by log levels
    if (filter.value.levels.length > 0) {
      entries = entries.filter(entry => filter.value.levels.includes(entry.level))
    }

    return entries
  })

  const levelCounts = computed(() => {
    if (!logStats.value) return null
    return logStats.value.byLevel
  })

  const hasLogs = computed(() => logEntries.value.length > 0)

  async function loadFile(file: File) {
    isLoading.value = true
    fileName.value = file.name

    try {
      const content = await file.text()
      const parsed = parse(content)
      
      logEntries.value = parsed.entries
      logStats.value = parsed.stats
      logFormat.value = parsed.format
    } catch (error) {
      console.error('Error parsing log file:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function setSearch(search: string) {
    filter.value.search = search
  }

  function setSearchMode(mode: SearchMode) {
    filter.value.searchMode = mode
  }

  function toggleCaseSensitive() {
    filter.value.caseSensitive = !filter.value.caseSensitive
  }

  function toggleLevel(level: LogLevel) {
    const index = filter.value.levels.indexOf(level)
    if (index > -1) {
      filter.value.levels.splice(index, 1)
    } else {
      filter.value.levels.push(level)
    }
  }

  function setLevels(levels: LogLevel[]) {
    filter.value.levels = levels
  }

  function clearFilters() {
    filter.value = {
      search: '',
      searchMode: 'contains',
      caseSensitive: false,
      levels: [],
    }
  }

  function selectEntry(entry: LogEntry | null) {
    selectedEntry.value = entry
  }

  function toggleEntryExpanded(entry: LogEntry) {
    const found = logEntries.value.find(e => e.id === entry.id)
    if (found) {
      found.expanded = !found.expanded
    }
  }

  function reset() {
    logEntries.value = []
    logStats.value = null
    logFormat.value = 'unknown'
    fileName.value = ''
    selectedEntry.value = null
    clearFilters()
  }

  return {
    // State
    logEntries,
    logStats,
    logFormat,
    fileName,
    isLoading,
    filter,
    selectedEntry,
    
    // Computed
    filteredEntries,
    levelCounts,
    hasLogs,
    
    // Actions
    loadFile,
    setSearch,
    setSearchMode,
    toggleCaseSensitive,
    toggleLevel,
    setLevels,
    clearFilters,
    selectEntry,
    toggleEntryExpanded,
    reset,
  }
}

