// CPU Profile Types - Compatible with Chrome DevTools, Node.js, and V8 profiles

export interface CPUProfileNode {
  id: number
  callFrame: CallFrame
  hitCount: number
  children?: number[]
  positionTicks?: PositionTick[]
  deoptReason?: string
  // Computed fields
  selfTime?: number
  totalTime?: number
  selfPercentage?: number
  totalPercentage?: number
}

export interface CallFrame {
  functionName: string
  scriptId: string
  url: string
  lineNumber: number
  columnNumber: number
}

export interface PositionTick {
  line: number
  ticks: number
}

export interface CPUProfile {
  nodes: CPUProfileNode[]
  startTime: number
  endTime: number
  samples?: number[]
  timeDeltas?: number[]
  // Metadata
  title?: string
  duration?: number
}

export interface ProfileSample {
  nodeId: number
  timestamp: number
  delta: number
}

// Flame Graph Types
export interface FlameNode {
  id: number
  name: string
  value: number // Self time
  totalValue: number // Total time including children
  children: FlameNode[]
  depth: number
  x: number // Computed x position (0-1)
  width: number // Computed width (0-1)
  color?: string
  callFrame?: CallFrame
  percentage: number
  selfPercentage: number
  category?: FunctionCategory
}

// Call Tree Types
export interface CallTreeNode {
  id: number
  name: string
  selfTime: number
  totalTime: number
  selfPercentage: number
  totalPercentage: number
  hitCount: number
  children: CallTreeNode[]
  callFrame?: CallFrame
  expanded?: boolean
  depth: number
  category?: FunctionCategory
}

// Bottom-Up View Types
export interface BottomUpNode {
  id: string
  name: string
  selfTime: number
  totalTime: number
  selfPercentage: number
  totalPercentage: number
  hitCount: number
  callers: BottomUpNode[]
  callFrame?: CallFrame
  expanded?: boolean
  category?: FunctionCategory
}

// Hot Functions (Top-Down view)
export interface HotFunction {
  id: number
  name: string
  selfTime: number
  totalTime: number
  selfPercentage: number
  totalPercentage: number
  hitCount: number
  url: string
  line: number
  callFrame: CallFrame
  category?: FunctionCategory
  callers?: CallerInfo[]
  callees?: CalleeInfo[]
}

export interface CallerInfo {
  name: string
  selfTime: number
  percentage: number
  callFrame?: CallFrame
}

export interface CalleeInfo {
  name: string
  selfTime: number
  percentage: number
  callFrame?: CallFrame
}

// Timeline Types
export interface TimelineEvent {
  nodeId: number
  startTime: number
  duration: number
  name: string
  depth: number
  category?: FunctionCategory
}

export interface TimelineData {
  events: TimelineEvent[]
  duration: number
  maxDepth: number
}

// Function Categories
export type FunctionCategory = 
  | 'javascript'
  | 'native'
  | 'gc'
  | 'idle'
  | 'program'
  | 'system'
  | 'wasm'
  | 'regexp'
  | 'compile'
  | 'other'

export interface CategoryStats {
  category: FunctionCategory
  time: number
  percentage: number
  count: number
  color: string
  label: string
}

// Source View Types
export interface SourceLine {
  lineNumber: number
  content?: string
  selfTime: number
  totalTime: number
  selfPercentage: number
  hitCount: number
}

export interface SourceFile {
  url: string
  fileName: string
  lines: SourceLine[]
  totalTime: number
  functions: HotFunction[]
}

// Profile Stats
export interface ProfileStats {
  totalTime: number
  totalSamples: number
  totalNodes: number
  topFunctions: HotFunction[]
  gcTime?: number
  idleTime?: number
  categories: CategoryStats[]
  samplesPerSecond: number
}

// Summary Charts Data
export interface SummaryData {
  categoryBreakdown: CategoryStats[]
  timelineHistogram: HistogramBucket[]
  topFunctionsChart: ChartDataPoint[]
  callDepthDistribution: HistogramBucket[]
}

export interface HistogramBucket {
  label: string
  value: number
  percentage: number
}

export interface ChartDataPoint {
  name: string
  value: number
  percentage: number
  color: string
}

// Parsed Profile Result
export interface ParsedProfile {
  profile: CPUProfile
  flameGraph: FlameNode
  callTree: CallTreeNode
  bottomUp: BottomUpNode[]
  hotFunctions: HotFunction[]
  timeline: TimelineData
  stats: ProfileStats
  summary: SummaryData
  sourceFiles: Map<string, SourceFile>
}

// Profile Filter
export interface ProfileFilter {
  search: string
  minPercentage: number
  hideIdle: boolean
  hideGC: boolean
  hideNative: boolean
  selectedNode?: number
  focusedNode?: number
  categories: FunctionCategory[]
}

// Comparison Types
export interface ProfileComparison {
  baseline: ParsedProfile
  comparison: ParsedProfile
  diff: ProfileDiff
}

export interface ProfileDiff {
  addedFunctions: HotFunction[]
  removedFunctions: HotFunction[]
  changedFunctions: FunctionDiff[]
  totalTimeDiff: number
  totalTimeDiffPercentage: number
}

export interface FunctionDiff {
  name: string
  baselineSelfTime: number
  comparisonSelfTime: number
  selfTimeDiff: number
  selfTimeDiffPercentage: number
  callFrame: CallFrame
}

// View Mode
export type ProfileViewMode = 
  | 'summary'
  | 'flamegraph'
  | 'calltree'
  | 'bottomup'
  | 'timeline'
  | 'source'

// Export Types
export interface ExportOptions {
  format: 'json' | 'csv' | 'html'
  includeFlameGraph: boolean
  includeCallTree: boolean
  includeHotFunctions: boolean
  includeTimeline: boolean
}
