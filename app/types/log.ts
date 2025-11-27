export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'success' | 'unknown'

export interface LogEntry {
  id: number
  timestamp?: string
  level: LogLevel
  message: string
  source?: string
  rawLine: string
  lineNumber: number
  metadata?: Record<string, unknown>
  isJson?: boolean
  expanded?: boolean
}

export interface LogStats {
  total: number
  byLevel: Record<LogLevel, number>
  timeRange?: {
    start: string
    end: string
  }
}

export type SearchMode = 'contains' | 'exact' | 'regex' | 'startsWith' | 'endsWith'

export interface LogFilter {
  search: string
  searchMode: SearchMode
  caseSensitive: boolean
  levels: LogLevel[]
  startTime?: string
  endTime?: string
}

export interface ParsedLog {
  entries: LogEntry[]
  stats: LogStats
  format: 'json' | 'apache' | 'nginx' | 'syslog' | 'custom' | 'unknown'
}

