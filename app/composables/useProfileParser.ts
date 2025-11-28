import type {
  CPUProfile,
  CPUProfileNode,
  FlameNode,
  CallTreeNode,
  BottomUpNode,
  HotFunction,
  TimelineData,
  TimelineEvent,
  ProfileStats,
  ParsedProfile,
  ProfileSample,
  FunctionCategory,
  CategoryStats,
  SummaryData,
  HistogramBucket,
  ChartDataPoint,
  SourceFile,
  SourceLine,
  CallerInfo,
  CalleeInfo,
} from '~/types/profile'

export function useProfileParser() {
  // Color palette for categories
  const categoryColors: Record<FunctionCategory, string> = {
    javascript: '#60a5fa', // blue
    native: '#a78bfa', // purple
    gc: '#f97316', // orange
    idle: '#6b7280', // gray
    program: '#64748b', // slate
    system: '#ec4899', // pink
    wasm: '#14b8a6', // teal
    regexp: '#eab308', // yellow
    compile: '#f472b6', // pink
    other: '#94a3b8', // slate
  }

  const categoryLabels: Record<FunctionCategory, string> = {
    javascript: 'JavaScript',
    native: 'Native',
    gc: 'Garbage Collection',
    idle: 'Idle',
    program: 'Program',
    system: 'System',
    wasm: 'WebAssembly',
    regexp: 'RegExp',
    compile: 'Compile',
    other: 'Other',
  }

  // Flame graph colors
  const flameColors = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80',
    '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa',
    '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6',
  ]

  function getFlameColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i)
      hash = hash & hash
    }
    return flameColors[Math.abs(hash) % flameColors.length]
  }

  function getCategoryColor(category: FunctionCategory): string {
    return categoryColors[category] || categoryColors.other
  }

  function detectCategory(node: CPUProfileNode): FunctionCategory {
    const name = node.callFrame.functionName.toLowerCase()
    const url = node.callFrame.url.toLowerCase()

    if (name === '(idle)') return 'idle'
    if (name === '(program)' || name === '(root)') return 'program'
    if (name.includes('garbage collector') || name.includes('(gc)')) return 'gc'
    if (name.includes('regexp') || name.includes('regular expression')) return 'regexp'
    if (name.includes('compile') || name.includes('optimize')) return 'compile'
    if (url.includes('wasm') || name.includes('wasm')) return 'wasm'
    if (url === '' || url.startsWith('native ') || name.startsWith('native ')) return 'native'
    if (url.includes('node:') || url.includes('internal/')) return 'system'
    if (url.endsWith('.js') || url.endsWith('.ts') || url.endsWith('.mjs')) return 'javascript'

    return 'other'
  }

  function isIdleOrGC(name: string): boolean {
    const lowerName = name.toLowerCase()
    return lowerName.includes('idle') ||
      lowerName.includes('(garbage collector)') ||
      lowerName.includes('(gc)') ||
      lowerName === '(program)' ||
      lowerName === '(root)'
  }

  function parseProfile(content: string): ParsedProfile {
    const profile = JSON.parse(content) as CPUProfile

    // Validate profile structure
    if (!profile.nodes || !Array.isArray(profile.nodes)) {
      throw new Error('Invalid CPU profile: missing nodes array')
    }

    // Calculate times for each node
    const nodeMap = new Map<number, CPUProfileNode & { category: FunctionCategory }>()
    profile.nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        selfTime: 0,
        totalTime: 0,
        category: detectCategory(node),
      })
    })

    // Calculate duration
    const duration = profile.endTime - profile.startTime

    // Build parent map for bottom-up analysis
    const parentMap = new Map<number, number[]>()
    profile.nodes.forEach(node => {
      if (node.children) {
        node.children.forEach(childId => {
          const parents = parentMap.get(childId) || []
          parents.push(node.id)
          parentMap.set(childId, parents)
        })
      }
    })

    // Process samples to calculate times
    if (profile.samples && profile.timeDeltas) {
      let currentTime = profile.startTime

      for (let i = 0; i < profile.samples.length; i++) {
        const delta = profile.timeDeltas[i] || 0
        currentTime += delta

        const node = nodeMap.get(profile.samples[i])
        if (node) {
          node.selfTime = (node.selfTime || 0) + delta
        }
      }
    } else {
      // Fallback: use hitCount if no samples
      const totalHits = profile.nodes.reduce((sum, n) => sum + n.hitCount, 0)
      const avgTimePerHit = totalHits > 0 ? duration / totalHits : 0
      profile.nodes.forEach(node => {
        const n = nodeMap.get(node.id)
        if (n) {
          n.selfTime = node.hitCount * avgTimePerHit
        }
      })
    }

    // Calculate total times using bottom-up approach
    function calculateTotalTime(nodeId: number, visited: Set<number> = new Set()): number {
      if (visited.has(nodeId)) return 0
      visited.add(nodeId)

      const node = nodeMap.get(nodeId)
      if (!node) return 0

      let totalTime = node.selfTime || 0
      const originalNode = profile.nodes.find(n => n.id === nodeId)
      if (originalNode?.children) {
        for (const childId of originalNode.children) {
          totalTime += calculateTotalTime(childId, visited)
        }
      }
      node.totalTime = totalTime
      return totalTime
    }

    const rootNode = profile.nodes[0]
    if (rootNode) {
      calculateTotalTime(rootNode.id)
    }

    // Calculate percentages
    const totalProfileTime = nodeMap.get(rootNode?.id || 1)?.totalTime || duration
    nodeMap.forEach(node => {
      node.selfPercentage = ((node.selfTime || 0) / totalProfileTime) * 100
      node.totalPercentage = ((node.totalTime || 0) / totalProfileTime) * 100
    })

    // Build all views
    const flameGraph = buildFlameGraph(profile, nodeMap, totalProfileTime)
    const callTree = buildCallTree(profile, nodeMap)
    const bottomUp = buildBottomUp(profile, nodeMap, parentMap)
    const hotFunctions = extractHotFunctions(profile, nodeMap, parentMap)
    const timeline = buildTimeline(profile, nodeMap)
    const categories = calculateCategories(nodeMap, totalProfileTime)
    const stats = calculateStats(profile, nodeMap, hotFunctions, totalProfileTime, categories)
    const summary = buildSummary(stats, hotFunctions, timeline, nodeMap)
    const sourceFiles = buildSourceFiles(profile, nodeMap)

    return {
      profile,
      flameGraph,
      callTree,
      bottomUp,
      hotFunctions,
      timeline,
      stats,
      summary,
      sourceFiles,
    }
  }

  function buildFlameGraph(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>,
    totalTime: number
  ): FlameNode {
    function buildNode(nodeId: number, depth: number, x: number, parentWidth: number): FlameNode {
      const node = nodeMap.get(nodeId)
      if (!node) {
        return {
          id: nodeId,
          name: 'Unknown',
          value: 0,
          totalValue: 0,
          children: [],
          depth,
          x,
          width: 0,
          percentage: 0,
          selfPercentage: 0,
        }
      }

      const selfTime = node.selfTime || 0
      const totalNodeTime = node.totalTime || 0
      const width = totalTime > 0 ? totalNodeTime / totalTime : 0
      const name = node.callFrame.functionName || '(anonymous)'

      const flameNode: FlameNode = {
        id: node.id,
        name,
        value: selfTime,
        totalValue: totalNodeTime,
        children: [],
        depth,
        x,
        width,
        color: getFlameColor(name),
        callFrame: node.callFrame,
        percentage: (totalNodeTime / totalTime) * 100,
        selfPercentage: (selfTime / totalTime) * 100,
        category: node.category,
      }

      const originalNode = profile.nodes.find(n => n.id === nodeId)
      if (originalNode?.children && originalNode.children.length > 0) {
        let childX = x
        for (const childId of originalNode.children) {
          const childNode = buildNode(childId, depth + 1, childX, width)
          if (childNode.width > 0) {
            flameNode.children.push(childNode)
            childX += childNode.width
          }
        }
      }

      return flameNode
    }

    const rootId = profile.nodes[0]?.id || 1
    return buildNode(rootId, 0, 0, 1)
  }

  function buildCallTree(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>
  ): CallTreeNode {
    function buildNode(nodeId: number, depth: number): CallTreeNode {
      const node = nodeMap.get(nodeId)
      if (!node) {
        return {
          id: nodeId,
          name: 'Unknown',
          selfTime: 0,
          totalTime: 0,
          selfPercentage: 0,
          totalPercentage: 0,
          hitCount: 0,
          children: [],
          depth,
          expanded: depth < 2,
        }
      }

      const name = node.callFrame.functionName || '(anonymous)'

      const treeNode: CallTreeNode = {
        id: node.id,
        name,
        selfTime: node.selfTime || 0,
        totalTime: node.totalTime || 0,
        selfPercentage: node.selfPercentage || 0,
        totalPercentage: node.totalPercentage || 0,
        hitCount: node.hitCount,
        children: [],
        callFrame: node.callFrame,
        depth,
        expanded: depth < 2,
        category: node.category,
      }

      const originalNode = profile.nodes.find(n => n.id === nodeId)
      if (originalNode?.children && originalNode.children.length > 0) {
        const childNodes = originalNode.children
          .map(childId => buildNode(childId, depth + 1))
          .filter(c => c.totalTime > 0)
          .sort((a, b) => b.totalTime - a.totalTime)
        treeNode.children = childNodes
      }

      return treeNode
    }

    const rootId = profile.nodes[0]?.id || 1
    return buildNode(rootId, 0)
  }

  function buildBottomUp(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>,
    parentMap: Map<number, number[]>
  ): BottomUpNode[] {
    // Group by function name and aggregate
    const functionMap = new Map<string, {
      selfTime: number
      totalTime: number
      hitCount: number
      callerIds: Set<number>
      nodeIds: number[]
      callFrame: CPUProfileNode['callFrame']
      category: FunctionCategory
    }>()

    nodeMap.forEach((node, nodeId) => {
      const name = node.callFrame.functionName || '(anonymous)'
      const existing = functionMap.get(name)

      if (existing) {
        existing.selfTime += node.selfTime || 0
        existing.totalTime += node.totalTime || 0
        existing.hitCount += node.hitCount
        existing.nodeIds.push(nodeId)

        const parents = parentMap.get(nodeId) || []
        parents.forEach(p => existing.callerIds.add(p))
      } else {
        const parents = parentMap.get(nodeId) || []
        functionMap.set(name, {
          selfTime: node.selfTime || 0,
          totalTime: node.totalTime || 0,
          hitCount: node.hitCount,
          callerIds: new Set(parents),
          nodeIds: [nodeId],
          callFrame: node.callFrame,
          category: node.category,
        })
      }
    })

    // Calculate total for percentages
    const totalTime = nodeMap.get(profile.nodes[0]?.id || 1)?.totalTime || 1

    // Convert to BottomUpNode array
    const bottomUpNodes: BottomUpNode[] = []

    functionMap.forEach((data, name) => {
      if (name === '(root)' || name === '(program)') return

      const node: BottomUpNode = {
        id: `bu-${name}`,
        name,
        selfTime: data.selfTime,
        totalTime: data.totalTime,
        selfPercentage: (data.selfTime / totalTime) * 100,
        totalPercentage: (data.totalTime / totalTime) * 100,
        hitCount: data.hitCount,
        callers: [],
        callFrame: data.callFrame,
        expanded: false,
        category: data.category,
      }

      // Build callers
      const callerMap = new Map<string, { time: number; count: number; callFrame?: CPUProfileNode['callFrame'] }>()
      data.callerIds.forEach(callerId => {
        const caller = nodeMap.get(callerId)
        if (caller) {
          const callerName = caller.callFrame.functionName || '(anonymous)'
          const existing = callerMap.get(callerName)
          if (existing) {
            existing.time += caller.selfTime || 0
            existing.count++
          } else {
            callerMap.set(callerName, {
              time: caller.selfTime || 0,
              count: 1,
              callFrame: caller.callFrame,
            })
          }
        }
      })

      callerMap.forEach((callerData, callerName) => {
        node.callers.push({
          id: `bu-caller-${callerName}-${name}`,
          name: callerName,
          selfTime: callerData.time,
          totalTime: callerData.time,
          selfPercentage: (callerData.time / totalTime) * 100,
          totalPercentage: (callerData.time / totalTime) * 100,
          hitCount: callerData.count,
          callers: [],
          callFrame: callerData.callFrame,
          expanded: false,
        })
      })

      node.callers.sort((a, b) => b.selfTime - a.selfTime)
      bottomUpNodes.push(node)
    })

    return bottomUpNodes.sort((a, b) => b.selfTime - a.selfTime)
  }

  function extractHotFunctions(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>,
    parentMap: Map<number, number[]>
  ): HotFunction[] {
    const functions: HotFunction[] = []
    const totalTime = nodeMap.get(profile.nodes[0]?.id || 1)?.totalTime || 1

    nodeMap.forEach((node, id) => {
      if (node.selfTime && node.selfTime > 0) {
        const name = node.callFrame.functionName || '(anonymous)'

        if (name === '(root)' || name === '(program)') return

        // Get callers
        const callers: CallerInfo[] = []
        const parents = parentMap.get(id) || []
        parents.forEach(parentId => {
          const parent = nodeMap.get(parentId)
          if (parent) {
            callers.push({
              name: parent.callFrame.functionName || '(anonymous)',
              selfTime: parent.selfTime || 0,
              percentage: ((parent.selfTime || 0) / totalTime) * 100,
              callFrame: parent.callFrame,
            })
          }
        })

        // Get callees
        const callees: CalleeInfo[] = []
        const originalNode = profile.nodes.find(n => n.id === id)
        if (originalNode?.children) {
          originalNode.children.forEach(childId => {
            const child = nodeMap.get(childId)
            if (child) {
              callees.push({
                name: child.callFrame.functionName || '(anonymous)',
                selfTime: child.selfTime || 0,
                percentage: ((child.selfTime || 0) / totalTime) * 100,
                callFrame: child.callFrame,
              })
            }
          })
        }

        functions.push({
          id,
          name,
          selfTime: node.selfTime,
          totalTime: node.totalTime || 0,
          selfPercentage: node.selfPercentage || 0,
          totalPercentage: node.totalPercentage || 0,
          hitCount: node.hitCount,
          url: node.callFrame.url || '',
          line: node.callFrame.lineNumber,
          callFrame: node.callFrame,
          category: node.category,
          callers: callers.sort((a, b) => b.selfTime - a.selfTime),
          callees: callees.sort((a, b) => b.selfTime - a.selfTime),
        })
      }
    })

    return functions.sort((a, b) => b.selfTime - a.selfTime)
  }

  function buildTimeline(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>
  ): TimelineData {
    const events: TimelineEvent[] = []
    let maxDepth = 0

    if (profile.samples && profile.timeDeltas) {
      let currentTime = profile.startTime
      let currentNodeId = -1
      let eventStart = profile.startTime

      for (let i = 0; i < profile.samples.length; i++) {
        const nodeId = profile.samples[i]
        const delta = profile.timeDeltas[i] || 0

        if (nodeId !== currentNodeId) {
          if (currentNodeId !== -1) {
            const node = nodeMap.get(currentNodeId)
            if (node) {
              const depth = getNodeDepth(profile, currentNodeId)
              events.push({
                nodeId: currentNodeId,
                startTime: eventStart - profile.startTime,
                duration: currentTime - eventStart,
                name: node.callFrame.functionName || '(anonymous)',
                depth,
                category: node.category,
              })
              maxDepth = Math.max(maxDepth, depth)
            }
          }
          currentNodeId = nodeId
          eventStart = currentTime
        }

        currentTime += delta
      }

      if (currentNodeId !== -1) {
        const node = nodeMap.get(currentNodeId)
        if (node) {
          const depth = getNodeDepth(profile, currentNodeId)
          events.push({
            nodeId: currentNodeId,
            startTime: eventStart - profile.startTime,
            duration: currentTime - eventStart,
            name: node.callFrame.functionName || '(anonymous)',
            depth,
            category: node.category,
          })
          maxDepth = Math.max(maxDepth, depth)
        }
      }
    }

    return {
      events,
      duration: profile.endTime - profile.startTime,
      maxDepth,
    }
  }

  function getNodeDepth(profile: CPUProfile, targetId: number): number {
    function findDepth(nodeId: number, currentDepth: number): number {
      if (nodeId === targetId) return currentDepth

      const node = profile.nodes.find(n => n.id === nodeId)
      if (node?.children) {
        for (const childId of node.children) {
          const depth = findDepth(childId, currentDepth + 1)
          if (depth >= 0) return depth
        }
      }
      return -1
    }

    const rootId = profile.nodes[0]?.id || 1
    const depth = findDepth(rootId, 0)
    return depth >= 0 ? depth : 0
  }

  function calculateCategories(
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>,
    totalTime: number
  ): CategoryStats[] {
    const categoryTimes = new Map<FunctionCategory, { time: number; count: number }>()

    nodeMap.forEach(node => {
      const existing = categoryTimes.get(node.category)
      const selfTime = node.selfTime || 0
      if (existing) {
        existing.time += selfTime
        existing.count++
      } else {
        categoryTimes.set(node.category, { time: selfTime, count: 1 })
      }
    })

    const categories: CategoryStats[] = []
    categoryTimes.forEach((data, category) => {
      categories.push({
        category,
        time: data.time,
        percentage: (data.time / totalTime) * 100,
        count: data.count,
        color: categoryColors[category],
        label: categoryLabels[category],
      })
    })

    return categories.sort((a, b) => b.time - a.time)
  }

  function calculateStats(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>,
    hotFunctions: HotFunction[],
    totalTime: number,
    categories: CategoryStats[]
  ): ProfileStats {
    let gcTime = 0
    let idleTime = 0

    nodeMap.forEach(node => {
      if (node.category === 'gc') {
        gcTime += node.selfTime || 0
      }
      if (node.category === 'idle') {
        idleTime += node.selfTime || 0
      }
    })

    const duration = profile.endTime - profile.startTime
    const samplesPerSecond = profile.samples
      ? (profile.samples.length / (duration / 1000000))
      : 0

    return {
      totalTime,
      totalSamples: profile.samples?.length || 0,
      totalNodes: profile.nodes.length,
      topFunctions: hotFunctions.slice(0, 10),
      gcTime,
      idleTime,
      categories,
      samplesPerSecond,
    }
  }

  function buildSummary(
    stats: ProfileStats,
    hotFunctions: HotFunction[],
    timeline: TimelineData,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>
  ): SummaryData {
    // Category breakdown for pie chart
    const categoryBreakdown = stats.categories.filter(c => c.percentage > 0.1)

    // Timeline histogram (10 buckets)
    const bucketCount = 20
    const bucketSize = timeline.duration / bucketCount
    const timelineHistogram: HistogramBucket[] = []

    for (let i = 0; i < bucketCount; i++) {
      const start = i * bucketSize
      const end = (i + 1) * bucketSize
      let value = 0

      timeline.events.forEach(event => {
        const eventEnd = event.startTime + event.duration
        if (event.startTime < end && eventEnd > start) {
          const overlapStart = Math.max(event.startTime, start)
          const overlapEnd = Math.min(eventEnd, end)
          value += overlapEnd - overlapStart
        }
      })

      timelineHistogram.push({
        label: formatTime(start),
        value,
        percentage: (value / bucketSize) * 100,
      })
    }

    // Top functions chart
    const topFunctionsChart: ChartDataPoint[] = hotFunctions.slice(0, 10).map(fn => ({
      name: fn.name.length > 20 ? fn.name.slice(0, 20) + '...' : fn.name,
      value: fn.selfTime,
      percentage: fn.selfPercentage,
      color: getFlameColor(fn.name),
    }))

    // Call depth distribution
    const depthCounts = new Map<number, number>()
    nodeMap.forEach(node => {
      // This is simplified - would need proper depth calculation
      const depth = 0 // Placeholder
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + (node.selfTime || 0))
    })

    const callDepthDistribution: HistogramBucket[] = Array.from(depthCounts.entries())
      .map(([depth, value]) => ({
        label: `Depth ${depth}`,
        value,
        percentage: (value / stats.totalTime) * 100,
      }))
      .sort((a, b) => parseInt(a.label.split(' ')[1]) - parseInt(b.label.split(' ')[1]))

    return {
      categoryBreakdown,
      timelineHistogram,
      topFunctionsChart,
      callDepthDistribution,
    }
  }

  function buildSourceFiles(
    profile: CPUProfile,
    nodeMap: Map<number, CPUProfileNode & { category: FunctionCategory }>
  ): Map<string, SourceFile> {
    const sourceFiles = new Map<string, SourceFile>()

    nodeMap.forEach(node => {
      const url = node.callFrame.url
      if (!url || url === '') return

      let sourceFile = sourceFiles.get(url)
      if (!sourceFile) {
        const parts = url.split('/')
        sourceFile = {
          url,
          fileName: parts[parts.length - 1] || url,
          lines: [],
          totalTime: 0,
          functions: [],
        }
        sourceFiles.set(url, sourceFile)
      }

      sourceFile.totalTime += node.selfTime || 0

      // Add position ticks if available
      if (node.positionTicks) {
        node.positionTicks.forEach(tick => {
          const existingLine = sourceFile!.lines.find(l => l.lineNumber === tick.line)
          if (existingLine) {
            existingLine.hitCount += tick.ticks
          } else {
            sourceFile!.lines.push({
              lineNumber: tick.line,
              selfTime: 0,
              totalTime: 0,
              selfPercentage: 0,
              hitCount: tick.ticks,
            })
          }
        })
      }

      // Add line from callFrame
      const lineNumber = node.callFrame.lineNumber
      if (lineNumber >= 0) {
        const existingLine = sourceFile.lines.find(l => l.lineNumber === lineNumber)
        if (existingLine) {
          existingLine.selfTime += node.selfTime || 0
          existingLine.hitCount += node.hitCount
        } else {
          sourceFile.lines.push({
            lineNumber,
            selfTime: node.selfTime || 0,
            totalTime: node.totalTime || 0,
            selfPercentage: node.selfPercentage || 0,
            hitCount: node.hitCount,
          })
        }
      }
    })

    // Sort lines by line number
    sourceFiles.forEach(file => {
      file.lines.sort((a, b) => a.lineNumber - b.lineNumber)
    })

    return sourceFiles
  }

  function formatTime(microseconds: number): string {
    if (microseconds < 1000) {
      return `${microseconds.toFixed(0)}µs`
    } else if (microseconds < 1000000) {
      return `${(microseconds / 1000).toFixed(2)}ms`
    } else {
      return `${(microseconds / 1000000).toFixed(2)}s`
    }
  }

  function formatPercentage(value: number): string {
    if (value < 0.01) return '<0.01%'
    if (value < 1) return value.toFixed(2) + '%'
    return value.toFixed(1) + '%'
  }

  return {
    parseProfile,
    formatTime,
    formatPercentage,
    isIdleOrGC,
    getFlameColor,
    getCategoryColor,
    categoryColors,
    categoryLabels,
  }
}
