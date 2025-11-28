import type {
  ParsedProfile,
  ProfileFilter,
  FlameNode,
  CallTreeNode,
  BottomUpNode,
  HotFunction,
  FunctionCategory,
  ProfileViewMode,
  SourceFile,
} from '~/types/profile'

const parsedProfile = ref<ParsedProfile | null>(null)
const fileName = ref<string>('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const filter = ref<ProfileFilter>({
  search: '',
  minPercentage: 0,
  hideIdle: true,
  hideGC: false,
  hideNative: false,
  selectedNode: undefined,
  focusedNode: undefined,
  categories: [],
})
const selectedFunction = ref<HotFunction | null>(null)
const hoveredNode = ref<FlameNode | null>(null)
const viewMode = ref<ProfileViewMode>('summary')

export function useProfileStore() {
  const { parseProfile, isIdleOrGC, getCategoryColor } = useProfileParser()

  const hasProfile = computed(() => parsedProfile.value !== null)

  const flameGraph = computed(() => parsedProfile.value?.flameGraph || null)

  const callTree = computed(() => parsedProfile.value?.callTree || null)

  const bottomUp = computed(() => parsedProfile.value?.bottomUp || [])

  const stats = computed(() => parsedProfile.value?.stats || null)

  const summary = computed(() => parsedProfile.value?.summary || null)

  const timeline = computed(() => parsedProfile.value?.timeline || null)

  const sourceFiles = computed(() => parsedProfile.value?.sourceFiles || new Map<string, SourceFile>())

  // Filtered hot functions
  const filteredHotFunctions = computed(() => {
    if (!parsedProfile.value) return []

    let functions = parsedProfile.value.hotFunctions

    // Apply search filter
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase()
      functions = functions.filter(f =>
        f.name.toLowerCase().includes(searchLower) ||
        f.url.toLowerCase().includes(searchLower)
      )
    }

    // Apply minimum percentage filter
    if (filter.value.minPercentage > 0) {
      functions = functions.filter(f => f.selfPercentage >= filter.value.minPercentage)
    }

    // Hide idle
    if (filter.value.hideIdle) {
      functions = functions.filter(f => f.category !== 'idle' && f.category !== 'program')
    }

    // Hide GC
    if (filter.value.hideGC) {
      functions = functions.filter(f => f.category !== 'gc')
    }

    // Hide native
    if (filter.value.hideNative) {
      functions = functions.filter(f => f.category !== 'native')
    }

    // Filter by categories
    if (filter.value.categories.length > 0) {
      functions = functions.filter(f => filter.value.categories.includes(f.category || 'other'))
    }

    return functions
  })

  // Filtered bottom-up
  const filteredBottomUp = computed(() => {
    if (!parsedProfile.value) return []

    let nodes = [...parsedProfile.value.bottomUp]

    // Apply search filter
    if (filter.value.search) {
      const searchLower = filter.value.search.toLowerCase()
      nodes = nodes.filter(n =>
        n.name.toLowerCase().includes(searchLower) ||
        (n.callFrame?.url || '').toLowerCase().includes(searchLower)
      )
    }

    // Apply minimum percentage filter
    if (filter.value.minPercentage > 0) {
      nodes = nodes.filter(n => n.selfPercentage >= filter.value.minPercentage)
    }

    // Hide idle
    if (filter.value.hideIdle) {
      nodes = nodes.filter(n => n.category !== 'idle' && n.category !== 'program')
    }

    // Hide GC
    if (filter.value.hideGC) {
      nodes = nodes.filter(n => n.category !== 'gc')
    }

    // Hide native
    if (filter.value.hideNative) {
      nodes = nodes.filter(n => n.category !== 'native')
    }

    return nodes
  })

  // Filtered flame graph nodes (for highlighting)
  const matchingNodeIds = computed(() => {
    if (!filter.value.search || !parsedProfile.value) return new Set<number>()

    const searchLower = filter.value.search.toLowerCase()
    const matching = new Set<number>()

    function searchNodes(node: FlameNode) {
      if (node.name.toLowerCase().includes(searchLower)) {
        matching.add(node.id)
      }
      node.children.forEach(searchNodes)
    }

    if (parsedProfile.value.flameGraph) {
      searchNodes(parsedProfile.value.flameGraph)
    }

    return matching
  })

  async function loadFile(file: File) {
    isLoading.value = true
    error.value = null
    fileName.value = file.name

    try {
      const content = await file.text()
      const parsed = parseProfile(content)
      parsedProfile.value = parsed
      viewMode.value = 'summary'
    } catch (e) {
      console.error('Error parsing profile:', e)
      error.value = e instanceof Error ? e.message : 'Failed to parse profile'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function setViewMode(mode: ProfileViewMode) {
    viewMode.value = mode
  }

  function setSearch(search: string) {
    filter.value.search = search
  }

  function setMinPercentage(min: number) {
    filter.value.minPercentage = min
  }

  function toggleHideIdle() {
    filter.value.hideIdle = !filter.value.hideIdle
  }

  function toggleHideGC() {
    filter.value.hideGC = !filter.value.hideGC
  }

  function toggleHideNative() {
    filter.value.hideNative = !filter.value.hideNative
  }

  function toggleCategory(category: FunctionCategory) {
    const index = filter.value.categories.indexOf(category)
    if (index === -1) {
      filter.value.categories.push(category)
    } else {
      filter.value.categories.splice(index, 1)
    }
  }

  function selectFunction(fn: HotFunction | null) {
    selectedFunction.value = fn
    filter.value.selectedNode = fn?.id
  }

  function setHoveredNode(node: FlameNode | null) {
    hoveredNode.value = node
  }

  function toggleCallTreeNode(node: CallTreeNode) {
    node.expanded = !node.expanded
  }

  function toggleBottomUpNode(node: BottomUpNode) {
    node.expanded = !node.expanded
  }

  function focusNode(nodeId: number) {
    filter.value.focusedNode = nodeId
  }

  function clearFocus() {
    filter.value.focusedNode = undefined
  }

  function reset() {
    parsedProfile.value = null
    fileName.value = ''
    error.value = null
    selectedFunction.value = null
    hoveredNode.value = null
    viewMode.value = 'summary'
    filter.value = {
      search: '',
      minPercentage: 0,
      hideIdle: true,
      hideGC: false,
      hideNative: false,
      selectedNode: undefined,
      focusedNode: undefined,
      categories: [],
    }
  }

  return {
    // State
    parsedProfile,
    fileName,
    isLoading,
    error,
    filter,
    selectedFunction,
    hoveredNode,
    viewMode,

    // Computed
    hasProfile,
    flameGraph,
    callTree,
    bottomUp,
    stats,
    summary,
    timeline,
    sourceFiles,
    filteredHotFunctions,
    filteredBottomUp,
    matchingNodeIds,

    // Actions
    loadFile,
    setViewMode,
    setSearch,
    setMinPercentage,
    toggleHideIdle,
    toggleHideGC,
    toggleHideNative,
    toggleCategory,
    selectFunction,
    setHoveredNode,
    toggleCallTreeNode,
    toggleBottomUpNode,
    focusNode,
    clearFocus,
    reset,
  }
}
