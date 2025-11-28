// OpenTelemetry/Jaeger Trace Types

export interface SpanContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  traceFlags?: number
  traceState?: string
}

export interface SpanEvent {
  name: string
  timestamp: number
  attributes?: Record<string, string | number | boolean>
}

export interface SpanLink {
  context: SpanContext
  attributes?: Record<string, string | number | boolean>
}

export type SpanStatus = 'OK' | 'ERROR' | 'UNSET'
export type SpanKind = 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER'

export interface Span {
  traceId: string
  spanId: string
  parentSpanId?: string
  operationName: string
  serviceName: string
  startTime: number // microseconds since epoch
  duration: number // microseconds
  status: SpanStatus
  kind: SpanKind
  tags: Record<string, string | number | boolean>
  logs: SpanEvent[]
  references?: SpanLink[]
  warnings?: string[]
  // Computed fields
  depth?: number
  children?: Span[]
}

export interface Trace {
  traceId: string
  spans: Span[]
  services: string[]
  rootSpan?: Span
  duration: number // Total trace duration
  startTime: number
  endTime: number
  spanCount: number
  errorCount: number
}

export interface ServiceNode {
  name: string
  spanCount: number
  errorCount: number
  avgDuration: number
  calls: Map<string, number> // Map of service -> call count
}

export interface TraceStats {
  totalSpans: number
  totalServices: number
  totalDuration: number
  errorCount: number
  avgSpanDuration: number
  serviceBreakdown: Array<{
    name: string
    count: number
    percentage: number
    duration: number
  }>
  statusBreakdown: {
    ok: number
    error: number
    unset: number
  }
}

export interface TraceFilter {
  search: string
  service: string
  operation: string
  status: SpanStatus | 'ALL'
  minDuration: number
  maxDuration: number
}

// OpenTelemetry JSON format (OTLP)
export interface OTLPTrace {
  resourceSpans: Array<{
    resource: {
      attributes: Array<{
        key: string
        value: { stringValue?: string; intValue?: number; boolValue?: boolean }
      }>
    }
    scopeSpans: Array<{
      scope?: {
        name?: string
        version?: string
      }
      spans: Array<{
        traceId: string
        spanId: string
        parentSpanId?: string
        name: string
        kind: number
        startTimeUnixNano: string
        endTimeUnixNano: string
        attributes?: Array<{
          key: string
          value: { stringValue?: string; intValue?: number; boolValue?: boolean }
        }>
        status?: {
          code?: number
          message?: string
        }
        events?: Array<{
          name: string
          timeUnixNano: string
          attributes?: Array<{
            key: string
            value: { stringValue?: string; intValue?: number; boolValue?: boolean }
          }>
        }>
        links?: Array<{
          traceId: string
          spanId: string
          attributes?: Array<{
            key: string
            value: { stringValue?: string; intValue?: number; boolValue?: boolean }
          }>
        }>
      }>
    }>
  }>
}

// Jaeger JSON format
export interface JaegerTrace {
  data: Array<{
    traceID: string
    spans: Array<{
      traceID: string
      spanID: string
      operationName: string
      references?: Array<{
        refType: string
        traceID: string
        spanID: string
      }>
      startTime: number
      duration: number
      tags: Array<{
        key: string
        type: string
        value: string | number | boolean
      }>
      logs?: Array<{
        timestamp: number
        fields: Array<{
          key: string
          type: string
          value: string | number | boolean
        }>
      }>
      processID: string
      warnings?: string[]
    }>
    processes: Record<string, {
      serviceName: string
      tags?: Array<{
        key: string
        type: string
        value: string | number | boolean
      }>
    }>
  }>
}

