import type { 
  Trace, 
  Span, 
  SpanStatus, 
  SpanKind, 
  SpanEvent,
  TraceStats,
  OTLPTrace,
  JaegerTrace 
} from '~/types/trace'

export function useTraceParser() {
  
  // Detect trace format
  function detectFormat(data: unknown): 'otlp' | 'jaeger' | 'unknown' {
    if (!data || typeof data !== 'object') return 'unknown'
    
    const obj = data as Record<string, unknown>
    
    // OTLP format has resourceSpans
    if ('resourceSpans' in obj && Array.isArray(obj.resourceSpans)) {
      return 'otlp'
    }
    
    // Jaeger format has data array with spans
    if ('data' in obj && Array.isArray(obj.data)) {
      return 'jaeger'
    }
    
    return 'unknown'
  }

  // Parse OTLP format
  function parseOTLP(data: OTLPTrace): Trace {
    const spans: Span[] = []
    const services = new Set<string>()
    
    for (const resourceSpan of data.resourceSpans) {
      // Extract service name from resource attributes
      const serviceNameAttr = resourceSpan.resource.attributes.find(
        attr => attr.key === 'service.name'
      )
      const serviceName = serviceNameAttr?.value.stringValue || 'unknown'
      services.add(serviceName)
      
      for (const scopeSpan of resourceSpan.scopeSpans) {
        for (const span of scopeSpan.spans) {
          const startTime = Number(span.startTimeUnixNano) / 1000 // Convert to microseconds
          const endTime = Number(span.endTimeUnixNano) / 1000
          
          // Parse attributes
          const tags: Record<string, string | number | boolean> = {}
          if (span.attributes) {
            for (const attr of span.attributes) {
              if (attr.value.stringValue !== undefined) {
                tags[attr.key] = attr.value.stringValue
              } else if (attr.value.intValue !== undefined) {
                tags[attr.key] = Number(attr.value.intValue)
              } else if (attr.value.boolValue !== undefined) {
                tags[attr.key] = attr.value.boolValue
              }
            }
          }
          
          // Parse events/logs
          const logs: SpanEvent[] = []
          if (span.events) {
            for (const event of span.events) {
              const eventAttrs: Record<string, string | number | boolean> = {}
              if (event.attributes) {
                for (const attr of event.attributes) {
                  if (attr.value.stringValue !== undefined) {
                    eventAttrs[attr.key] = attr.value.stringValue
                  } else if (attr.value.intValue !== undefined) {
                    eventAttrs[attr.key] = Number(attr.value.intValue)
                  } else if (attr.value.boolValue !== undefined) {
                    eventAttrs[attr.key] = attr.value.boolValue
                  }
                }
              }
              logs.push({
                name: event.name,
                timestamp: Number(event.timeUnixNano) / 1000,
                attributes: eventAttrs
              })
            }
          }
          
          // Map status code
          let status: SpanStatus = 'UNSET'
          if (span.status?.code === 1) status = 'OK'
          else if (span.status?.code === 2) status = 'ERROR'
          
          // Map span kind
          const kindMap: Record<number, SpanKind> = {
            0: 'INTERNAL',
            1: 'INTERNAL',
            2: 'SERVER',
            3: 'CLIENT',
            4: 'PRODUCER',
            5: 'CONSUMER'
          }
          
          spans.push({
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            operationName: span.name,
            serviceName,
            startTime,
            duration: endTime - startTime,
            status,
            kind: kindMap[span.kind] || 'INTERNAL',
            tags,
            logs
          })
        }
      }
    }
    
    return buildTrace(spans, Array.from(services))
  }

  // Parse Jaeger format
  function parseJaeger(data: JaegerTrace): Trace {
    if (!data.data || data.data.length === 0) {
      throw new Error('No trace data found')
    }
    
    const traceData = data.data[0]
    const spans: Span[] = []
    const services = new Set<string>()
    
    // Build process map
    const processMap = new Map<string, string>()
    for (const [processId, process] of Object.entries(traceData.processes)) {
      processMap.set(processId, process.serviceName)
      services.add(process.serviceName)
    }
    
    for (const span of traceData.spans) {
      const serviceName = processMap.get(span.processID) || 'unknown'
      
      // Parse tags
      const tags: Record<string, string | number | boolean> = {}
      for (const tag of span.tags) {
        tags[tag.key] = tag.value
      }
      
      // Parse logs
      const logs: SpanEvent[] = []
      if (span.logs) {
        for (const log of span.logs) {
          const attrs: Record<string, string | number | boolean> = {}
          for (const field of log.fields) {
            attrs[field.key] = field.value
          }
          logs.push({
            name: attrs['event'] as string || 'log',
            timestamp: log.timestamp,
            attributes: attrs
          })
        }
      }
      
      // Get parent span ID from references
      let parentSpanId: string | undefined
      if (span.references) {
        const parentRef = span.references.find(r => r.refType === 'CHILD_OF')
        parentSpanId = parentRef?.spanID
      }
      
      // Determine status from tags
      let status: SpanStatus = 'UNSET'
      if (tags['error'] === true || tags['otel.status_code'] === 'ERROR') {
        status = 'ERROR'
      } else if (tags['otel.status_code'] === 'OK') {
        status = 'OK'
      }
      
      // Determine kind from tags
      let kind: SpanKind = 'INTERNAL'
      const spanKind = tags['span.kind'] as string
      if (spanKind === 'server') kind = 'SERVER'
      else if (spanKind === 'client') kind = 'CLIENT'
      else if (spanKind === 'producer') kind = 'PRODUCER'
      else if (spanKind === 'consumer') kind = 'CONSUMER'
      
      spans.push({
        traceId: span.traceID,
        spanId: span.spanID,
        parentSpanId,
        operationName: span.operationName,
        serviceName,
        startTime: span.startTime,
        duration: span.duration,
        status,
        kind,
        tags,
        logs,
        warnings: span.warnings
      })
    }
    
    return buildTrace(spans, Array.from(services))
  }

  // Build trace structure from spans
  function buildTrace(spans: Span[], services: string[]): Trace {
    if (spans.length === 0) {
      throw new Error('No spans found')
    }
    
    // Sort spans by start time
    spans.sort((a, b) => a.startTime - b.startTime)
    
    const traceId = spans[0].traceId
    
    // Find root span (no parent or parent not in trace)
    const spanIds = new Set(spans.map(s => s.spanId))
    const rootSpan = spans.find(s => !s.parentSpanId || !spanIds.has(s.parentSpanId))
    
    // Calculate trace timing
    const startTime = Math.min(...spans.map(s => s.startTime))
    const endTime = Math.max(...spans.map(s => s.startTime + s.duration))
    
    // Build span tree and calculate depths
    const spanMap = new Map<string, Span>()
    for (const span of spans) {
      span.children = []
      spanMap.set(span.spanId, span)
    }
    
    for (const span of spans) {
      if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
        const parent = spanMap.get(span.parentSpanId)!
        parent.children!.push(span)
      }
    }
    
    // Calculate depths
    function setDepth(span: Span, depth: number) {
      span.depth = depth
      for (const child of span.children || []) {
        setDepth(child, depth + 1)
      }
    }
    
    if (rootSpan) {
      setDepth(rootSpan, 0)
    }
    
    // Count errors
    const errorCount = spans.filter(s => s.status === 'ERROR').length
    
    return {
      traceId,
      spans,
      services,
      rootSpan,
      duration: endTime - startTime,
      startTime,
      endTime,
      spanCount: spans.length,
      errorCount
    }
  }

  // Main parse function
  function parseTrace(content: string): Trace {
    const data = JSON.parse(content)
    const format = detectFormat(data)
    
    switch (format) {
      case 'otlp':
        return parseOTLP(data as OTLPTrace)
      case 'jaeger':
        return parseJaeger(data as JaegerTrace)
      default:
        throw new Error('Unknown trace format. Supported formats: OpenTelemetry (OTLP), Jaeger')
    }
  }

  // Calculate trace statistics
  function calculateStats(trace: Trace): TraceStats {
    const { spans } = trace
    
    // Service breakdown
    const serviceMap = new Map<string, { count: number; duration: number }>()
    for (const span of spans) {
      const current = serviceMap.get(span.serviceName) || { count: 0, duration: 0 }
      current.count++
      current.duration += span.duration
      serviceMap.set(span.serviceName, current)
    }
    
    const totalDuration = spans.reduce((sum, s) => sum + s.duration, 0)
    
    const serviceBreakdown = Array.from(serviceMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      percentage: (data.count / spans.length) * 100,
      duration: data.duration
    })).sort((a, b) => b.count - a.count)
    
    // Status breakdown
    const statusBreakdown = {
      ok: spans.filter(s => s.status === 'OK').length,
      error: spans.filter(s => s.status === 'ERROR').length,
      unset: spans.filter(s => s.status === 'UNSET').length
    }
    
    return {
      totalSpans: spans.length,
      totalServices: trace.services.length,
      totalDuration: trace.duration,
      errorCount: trace.errorCount,
      avgSpanDuration: totalDuration / spans.length,
      serviceBreakdown,
      statusBreakdown
    }
  }

  // Format duration for display
  function formatDuration(microseconds: number): string {
    if (microseconds < 1000) {
      return `${microseconds.toFixed(0)}μs`
    } else if (microseconds < 1000000) {
      return `${(microseconds / 1000).toFixed(2)}ms`
    } else {
      return `${(microseconds / 1000000).toFixed(2)}s`
    }
  }

  // Format timestamp for display
  function formatTimestamp(microseconds: number): string {
    const date = new Date(microseconds / 1000)
    return date.toISOString()
  }

  // Get span color by service (for visualization)
  function getServiceColor(serviceName: string, services: string[]): string {
    const colors = [
      '#00DC82', // Green
      '#f97316', // Orange
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#eab308', // Yellow
      '#3b82f6', // Blue
      '#ef4444', // Red
      '#10b981', // Emerald
      '#f59e0b', // Amber
    ]
    
    const index = services.indexOf(serviceName)
    return colors[index % colors.length]
  }

  // Get status color
  function getStatusColor(status: SpanStatus): string {
    switch (status) {
      case 'OK':
        return '#10b981' // Green
      case 'ERROR':
        return '#ef4444' // Red
      default:
        return '#6b7280' // Gray
    }
  }

  return {
    parseTrace,
    calculateStats,
    formatDuration,
    formatTimestamp,
    getServiceColor,
    getStatusColor,
    detectFormat
  }
}

