import type {
  ParsedProfile,
  HotFunction,
  ProfileComparison,
  ProfileDiff,
  FunctionDiff,
  CategoryStats,
} from '~/types/profile'

const baselineProfile = ref<ParsedProfile | null>(null)
const comparisonProfile = ref<ParsedProfile | null>(null)
const baselineFileName = ref<string>('')
const comparisonFileName = ref<string>('')
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useProfileComparison() {
  const { parseProfile, formatTime, formatPercentage } = useProfileParser()

  const hasComparison = computed(() => 
    baselineProfile.value !== null && comparisonProfile.value !== null
  )

  const hasBaseline = computed(() => baselineProfile.value !== null)

  // Calculate diff between two profiles
  const diff = computed<ProfileDiff | null>(() => {
    if (!baselineProfile.value || !comparisonProfile.value) return null

    const baselineFunctions = new Map<string, HotFunction>()
    const comparisonFunctions = new Map<string, HotFunction>()

    // Index baseline functions by name + url
    baselineProfile.value.hotFunctions.forEach(fn => {
      const key = `${fn.name}|${fn.url}|${fn.line}`
      baselineFunctions.set(key, fn)
    })

    // Index comparison functions
    comparisonProfile.value.hotFunctions.forEach(fn => {
      const key = `${fn.name}|${fn.url}|${fn.line}`
      comparisonFunctions.set(key, fn)
    })

    const addedFunctions: HotFunction[] = []
    const removedFunctions: HotFunction[] = []
    const changedFunctions: FunctionDiff[] = []

    // Find added and changed functions
    comparisonFunctions.forEach((compFn, key) => {
      const baseFn = baselineFunctions.get(key)
      
      if (!baseFn) {
        // Function is new in comparison
        addedFunctions.push(compFn)
      } else {
        // Function exists in both - calculate diff
        const selfTimeDiff = compFn.selfTime - baseFn.selfTime
        const selfTimeDiffPercentage = baseFn.selfTime > 0 
          ? ((selfTimeDiff / baseFn.selfTime) * 100)
          : (compFn.selfTime > 0 ? 100 : 0)

        // Only include if there's a significant change (>1%)
        if (Math.abs(selfTimeDiffPercentage) > 1 || Math.abs(selfTimeDiff) > 1000) {
          changedFunctions.push({
            name: compFn.name,
            baselineSelfTime: baseFn.selfTime,
            comparisonSelfTime: compFn.selfTime,
            selfTimeDiff,
            selfTimeDiffPercentage,
            callFrame: compFn.callFrame,
          })
        }
      }
    })

    // Find removed functions
    baselineFunctions.forEach((baseFn, key) => {
      if (!comparisonFunctions.has(key)) {
        removedFunctions.push(baseFn)
      }
    })

    // Sort by absolute diff
    changedFunctions.sort((a, b) => Math.abs(b.selfTimeDiff) - Math.abs(a.selfTimeDiff))
    addedFunctions.sort((a, b) => b.selfTime - a.selfTime)
    removedFunctions.sort((a, b) => b.selfTime - a.selfTime)

    // Calculate total time diff
    const totalTimeDiff = comparisonProfile.value.stats.totalTime - baselineProfile.value.stats.totalTime
    const totalTimeDiffPercentage = baselineProfile.value.stats.totalTime > 0
      ? ((totalTimeDiff / baselineProfile.value.stats.totalTime) * 100)
      : 0

    return {
      addedFunctions,
      removedFunctions,
      changedFunctions,
      totalTimeDiff,
      totalTimeDiffPercentage,
    }
  })

  // Category comparison
  const categoryComparison = computed(() => {
    if (!baselineProfile.value || !comparisonProfile.value) return []

    const baseCategories = new Map<string, CategoryStats>()
    baselineProfile.value.stats.categories.forEach(c => {
      baseCategories.set(c.category, c)
    })

    return comparisonProfile.value.stats.categories.map(compCat => {
      const baseCat = baseCategories.get(compCat.category)
      
      return {
        category: compCat.category,
        label: compCat.label,
        color: compCat.color,
        baselineTime: baseCat?.time || 0,
        baselinePercentage: baseCat?.percentage || 0,
        comparisonTime: compCat.time,
        comparisonPercentage: compCat.percentage,
        timeDiff: compCat.time - (baseCat?.time || 0),
        percentageDiff: compCat.percentage - (baseCat?.percentage || 0),
      }
    })
  })

  // Stats comparison
  const statsComparison = computed(() => {
    if (!baselineProfile.value || !comparisonProfile.value) return null

    const base = baselineProfile.value.stats
    const comp = comparisonProfile.value.stats

    return {
      totalTime: {
        baseline: base.totalTime,
        comparison: comp.totalTime,
        diff: comp.totalTime - base.totalTime,
        diffPercentage: base.totalTime > 0 ? ((comp.totalTime - base.totalTime) / base.totalTime) * 100 : 0,
      },
      totalSamples: {
        baseline: base.totalSamples,
        comparison: comp.totalSamples,
        diff: comp.totalSamples - base.totalSamples,
        diffPercentage: base.totalSamples > 0 ? ((comp.totalSamples - base.totalSamples) / base.totalSamples) * 100 : 0,
      },
      totalNodes: {
        baseline: base.totalNodes,
        comparison: comp.totalNodes,
        diff: comp.totalNodes - base.totalNodes,
        diffPercentage: base.totalNodes > 0 ? ((comp.totalNodes - base.totalNodes) / base.totalNodes) * 100 : 0,
      },
      gcTime: {
        baseline: base.gcTime || 0,
        comparison: comp.gcTime || 0,
        diff: (comp.gcTime || 0) - (base.gcTime || 0),
        diffPercentage: (base.gcTime || 0) > 0 ? (((comp.gcTime || 0) - (base.gcTime || 0)) / (base.gcTime || 1)) * 100 : 0,
      },
    }
  })

  // Top regressions (functions that got slower)
  const topRegressions = computed(() => {
    if (!diff.value) return []
    return diff.value.changedFunctions
      .filter(f => f.selfTimeDiff > 0)
      .slice(0, 10)
  })

  // Top improvements (functions that got faster)
  const topImprovements = computed(() => {
    if (!diff.value) return []
    return diff.value.changedFunctions
      .filter(f => f.selfTimeDiff < 0)
      .sort((a, b) => a.selfTimeDiff - b.selfTimeDiff)
      .slice(0, 10)
  })

  async function loadBaselineFile(file: File) {
    isLoading.value = true
    error.value = null
    baselineFileName.value = file.name

    try {
      const content = await file.text()
      const parsed = parseProfile(content)
      baselineProfile.value = parsed
    } catch (e) {
      console.error('Error parsing baseline profile:', e)
      error.value = e instanceof Error ? e.message : 'Failed to parse baseline profile'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function loadComparisonFile(file: File) {
    isLoading.value = true
    error.value = null
    comparisonFileName.value = file.name

    try {
      const content = await file.text()
      const parsed = parseProfile(content)
      comparisonProfile.value = parsed
    } catch (e) {
      console.error('Error parsing comparison profile:', e)
      error.value = e instanceof Error ? e.message : 'Failed to parse comparison profile'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function swapProfiles() {
    const tempProfile = baselineProfile.value
    const tempFileName = baselineFileName.value
    
    baselineProfile.value = comparisonProfile.value
    baselineFileName.value = comparisonFileName.value
    
    comparisonProfile.value = tempProfile
    comparisonFileName.value = tempFileName
  }

  function reset() {
    baselineProfile.value = null
    comparisonProfile.value = null
    baselineFileName.value = ''
    comparisonFileName.value = ''
    error.value = null
  }

  function resetComparison() {
    comparisonProfile.value = null
    comparisonFileName.value = ''
  }

  // Format diff with sign
  function formatDiff(value: number): string {
    const sign = value > 0 ? '+' : ''
    return sign + formatTime(value)
  }

  function formatDiffPercentage(value: number): string {
    const sign = value > 0 ? '+' : ''
    return sign + value.toFixed(1) + '%'
  }

  function getDiffColor(value: number, inverted = false): string {
    // For time: positive = worse (red), negative = better (green)
    // inverted: positive = better (green), negative = worse (red)
    if (value === 0) return 'text-[var(--log-text-muted)]'
    
    if (inverted) {
      return value > 0 ? 'text-green-400' : 'text-red-400'
    }
    return value > 0 ? 'text-red-400' : 'text-green-400'
  }

  return {
    // State
    baselineProfile,
    comparisonProfile,
    baselineFileName,
    comparisonFileName,
    isLoading,
    error,

    // Computed
    hasComparison,
    hasBaseline,
    diff,
    categoryComparison,
    statsComparison,
    topRegressions,
    topImprovements,

    // Actions
    loadBaselineFile,
    loadComparisonFile,
    swapProfiles,
    reset,
    resetComparison,

    // Helpers
    formatDiff,
    formatDiffPercentage,
    getDiffColor,
  }
}

