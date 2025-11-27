import type { LogEntry, LogLevel, LogStats, ParsedLog } from '~/types/log'

export function useLogParser() {
  // Regex patterns for different log formats
  const patterns = {
    // JSON log format
    json: /^\s*\{.*\}\s*$/,
    
    // Common log formats with timestamp and level
    // 2024-01-15T10:30:45.123Z [ERROR] Message
    // 2024-01-15 10:30:45 ERROR Message
    timestampLevel: /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)\s*[\[\(]?\s*(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|CRITICAL|SUCCESS|NOTICE)\s*[\]\)]?\s*[:\-]?\s*(.*)$/i,
    
    // Level first format: [ERROR] 2024-01-15 10:30:45 Message
    levelFirst: /^[\[\(]?\s*(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|CRITICAL|SUCCESS|NOTICE)\s*[\]\)]?\s*(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)\s*[:\-]?\s*(.*)$/i,
    
    // Simple level format: ERROR: Message or [ERROR] Message
    simpleLevel: /^[\[\(]?\s*(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|CRITICAL|SUCCESS|NOTICE)\s*[\]\)]?\s*[:\-]?\s*(.*)$/i,
    
    // Apache/Nginx combined log format
    apache: /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"([^"]+)"\s+(\d{3})\s+(\d+|-)/,
    
    // Syslog format
    syslog: /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[\d+\])?:\s*(.*)$/,
    
    // Docker/Container logs
    docker: /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(?:stdout|stderr)\s+(.*)$/,
    
    // Generic timestamp
    genericTimestamp: /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)\s+(.*)$/,
  }

  function detectLevel(text: string): LogLevel {
    const lowerText = text.toLowerCase()
    
    if (/\b(error|fatal|critical|exception|fail(?:ed|ure)?)\b/i.test(text)) return 'error'
    if (/\b(warn(?:ing)?|alert)\b/i.test(text)) return 'warn'
    if (/\b(info(?:rmation)?|notice)\b/i.test(text)) return 'info'
    if (/\b(debug)\b/i.test(text)) return 'debug'
    if (/\b(trace|verbose)\b/i.test(text)) return 'trace'
    if (/\b(success(?:ful)?|ok|completed)\b/i.test(text)) return 'success'
    
    // HTTP status codes
    if (/\b[45]\d{2}\b/.test(text)) return 'error'
    if (/\b[23]\d{2}\b/.test(text)) return 'success'
    
    return 'unknown'
  }

  function normalizeLevel(level: string): LogLevel {
    const normalized = level.toLowerCase()
    
    if (['error', 'fatal', 'critical'].includes(normalized)) return 'error'
    if (['warn', 'warning', 'alert'].includes(normalized)) return 'warn'
    if (['info', 'information', 'notice'].includes(normalized)) return 'info'
    if (['debug'].includes(normalized)) return 'debug'
    if (['trace', 'verbose'].includes(normalized)) return 'trace'
    if (['success'].includes(normalized)) return 'success'
    
    return 'unknown'
  }

  function parseJsonLog(line: string, lineNumber: number): LogEntry | null {
    try {
      const json = JSON.parse(line)
      
      // Try to extract common fields
      const timestamp = json.timestamp || json.time || json.date || json['@timestamp'] || json.ts
      const level = json.level || json.severity || json.loglevel || json.lvl
      const message = json.message || json.msg || json.text || json.log || JSON.stringify(json)
      const source = json.source || json.logger || json.service || json.app
      
      return {
        id: lineNumber,
        timestamp: timestamp?.toString(),
        level: level ? normalizeLevel(level.toString()) : detectLevel(message),
        message: typeof message === 'string' ? message : JSON.stringify(message),
        source,
        rawLine: line,
        lineNumber,
        metadata: json,
        isJson: true,
        expanded: false,
      }
    } catch {
      return null
    }
  }

  function parseLine(line: string, lineNumber: number): LogEntry {
    const trimmedLine = line.trim()
    
    if (!trimmedLine) {
      return {
        id: lineNumber,
        level: 'unknown',
        message: '',
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Try JSON format first
    if (patterns.json.test(trimmedLine)) {
      const jsonEntry = parseJsonLog(trimmedLine, lineNumber)
      if (jsonEntry) return jsonEntry
    }

    // Try timestamp + level format
    let match = trimmedLine.match(patterns.timestampLevel)
    if (match) {
      return {
        id: lineNumber,
        timestamp: match[1],
        level: normalizeLevel(match[2]),
        message: match[3],
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Try level first format
    match = trimmedLine.match(patterns.levelFirst)
    if (match) {
      return {
        id: lineNumber,
        timestamp: match[2],
        level: normalizeLevel(match[1]),
        message: match[3],
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Try syslog format
    match = trimmedLine.match(patterns.syslog)
    if (match) {
      return {
        id: lineNumber,
        timestamp: match[1],
        level: detectLevel(match[4]),
        message: match[4],
        source: `${match[2]}:${match[3]}`,
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Try Docker format
    match = trimmedLine.match(patterns.docker)
    if (match) {
      return {
        id: lineNumber,
        timestamp: match[1],
        level: detectLevel(match[2]),
        message: match[2],
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Try Apache/Nginx format
    match = trimmedLine.match(patterns.apache)
    if (match) {
      const statusCode = parseInt(match[4])
      let level: LogLevel = 'info'
      if (statusCode >= 500) level = 'error'
      else if (statusCode >= 400) level = 'warn'
      else if (statusCode >= 200 && statusCode < 300) level = 'success'
      
      return {
        id: lineNumber,
        timestamp: match[2],
        level,
        message: `${match[3]} - ${match[4]}`,
        source: match[1],
        rawLine: line,
        lineNumber,
        metadata: {
          ip: match[1],
          request: match[3],
          status: statusCode,
          bytes: match[5],
        },
        expanded: false,
      }
    }

    // Try simple level format
    match = trimmedLine.match(patterns.simpleLevel)
    if (match) {
      return {
        id: lineNumber,
        level: normalizeLevel(match[1]),
        message: match[2],
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Try generic timestamp format
    match = trimmedLine.match(patterns.genericTimestamp)
    if (match) {
      return {
        id: lineNumber,
        timestamp: match[1],
        level: detectLevel(match[2]),
        message: match[2],
        rawLine: line,
        lineNumber,
        expanded: false,
      }
    }

    // Fallback: detect level from content
    return {
      id: lineNumber,
      level: detectLevel(trimmedLine),
      message: trimmedLine,
      rawLine: line,
      lineNumber,
      expanded: false,
    }
  }

  function detectFormat(lines: string[]): ParsedLog['format'] {
    const sample = lines.slice(0, 50).filter(l => l.trim())
    
    let jsonCount = 0
    let apacheCount = 0
    let syslogCount = 0
    
    for (const line of sample) {
      if (patterns.json.test(line.trim())) jsonCount++
      if (patterns.apache.test(line)) apacheCount++
      if (patterns.syslog.test(line)) syslogCount++
    }
    
    const threshold = sample.length * 0.3
    
    if (jsonCount > threshold) return 'json'
    if (apacheCount > threshold) return 'apache'
    if (syslogCount > threshold) return 'syslog'
    
    return 'custom'
  }

  function calculateStats(entries: LogEntry[]): LogStats {
    const stats: LogStats = {
      total: entries.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        trace: 0,
        success: 0,
        unknown: 0,
      },
    }

    const timestamps: string[] = []

    for (const entry of entries) {
      stats.byLevel[entry.level]++
      if (entry.timestamp) {
        timestamps.push(entry.timestamp)
      }
    }

    if (timestamps.length > 0) {
      timestamps.sort()
      stats.timeRange = {
        start: timestamps[0],
        end: timestamps[timestamps.length - 1],
      }
    }

    return stats
  }

  function parse(content: string): ParsedLog {
    const lines = content.split(/\r?\n/)
    const entries = lines.map((line, index) => parseLine(line, index + 1)).filter(e => e.message.trim() !== '')
    const format = detectFormat(lines)
    const stats = calculateStats(entries)

    return { entries, stats, format }
  }

  return {
    parse,
    parseLine,
    detectLevel,
    calculateStats,
  }
}

