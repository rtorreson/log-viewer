// HAR (HTTP Archive) Types
// Based on HAR 1.2 Specification: http://www.softwareishard.com/blog/har-12-spec/

export interface HARFile {
  log: HARLog
}

export interface HARLog {
  version: string
  creator: HARCreator
  browser?: HARBrowser
  pages?: HARPage[]
  entries: HAREntry[]
  comment?: string
}

export interface HARCreator {
  name: string
  version: string
  comment?: string
}

export interface HARBrowser {
  name: string
  version: string
  comment?: string
}

export interface HARPage {
  startedDateTime: string
  id: string
  title: string
  pageTimings: HARPageTimings
  comment?: string
}

export interface HARPageTimings {
  onContentLoad?: number
  onLoad?: number
  comment?: string
}

export interface HAREntry {
  pageref?: string
  startedDateTime: string
  time: number
  request: HARRequest
  response: HARResponse
  cache: HARCache
  timings: HARTimings
  serverIPAddress?: string
  connection?: string
  comment?: string
  // Computed fields
  _id?: string
  _resourceType?: ResourceType
  _startOffset?: number
}

export interface HARRequest {
  method: string
  url: string
  httpVersion: string
  cookies: HARCookie[]
  headers: HARHeader[]
  queryString: HARQueryParam[]
  postData?: HARPostData
  headersSize: number
  bodySize: number
  comment?: string
}

export interface HARResponse {
  status: number
  statusText: string
  httpVersion: string
  cookies: HARCookie[]
  headers: HARHeader[]
  content: HARContent
  redirectURL: string
  headersSize: number
  bodySize: number
  comment?: string
  _transferSize?: number
}

export interface HARCookie {
  name: string
  value: string
  path?: string
  domain?: string
  expires?: string
  httpOnly?: boolean
  secure?: boolean
  comment?: string
}

export interface HARHeader {
  name: string
  value: string
  comment?: string
}

export interface HARQueryParam {
  name: string
  value: string
  comment?: string
}

export interface HARPostData {
  mimeType: string
  text?: string
  params?: HARParam[]
  comment?: string
}

export interface HARParam {
  name: string
  value?: string
  fileName?: string
  contentType?: string
  comment?: string
}

export interface HARContent {
  size: number
  compression?: number
  mimeType: string
  text?: string
  encoding?: string
  comment?: string
}

export interface HARCache {
  beforeRequest?: HARCacheEntry
  afterRequest?: HARCacheEntry
  comment?: string
}

export interface HARCacheEntry {
  expires?: string
  lastAccess: string
  eTag: string
  hitCount: number
  comment?: string
}

export interface HARTimings {
  blocked?: number
  dns?: number
  connect?: number
  send: number
  wait: number
  receive: number
  ssl?: number
  comment?: string
}

// Resource types
export type ResourceType = 
  | 'document'
  | 'stylesheet'
  | 'script'
  | 'image'
  | 'font'
  | 'xhr'
  | 'fetch'
  | 'websocket'
  | 'manifest'
  | 'media'
  | 'other'

// Network Stats
export interface NetworkStats {
  totalRequests: number
  totalTransferred: number
  totalResources: number
  totalTime: number
  domContentLoaded?: number
  pageLoad?: number
  typeBreakdown: Array<{
    type: ResourceType
    count: number
    size: number
    percentage: number
  }>
  statusBreakdown: Array<{
    status: string
    count: number
    percentage: number
  }>
  domainBreakdown: Array<{
    domain: string
    count: number
    size: number
  }>
}

// Network filters
export interface NetworkFilter {
  search: string
  type: ResourceType | 'all'
  status: string // '2xx', '3xx', '4xx', '5xx', 'all'
  domain: string
  minSize: number
  maxSize: number
}

// Processed entry for display
export interface ProcessedEntry {
  id: string
  url: string
  name: string
  domain: string
  method: string
  status: number
  statusText: string
  type: ResourceType
  mimeType: string
  size: number
  transferSize: number
  time: number
  startTime: number
  endTime: number
  startOffset: number
  timings: {
    blocked: number
    dns: number
    connect: number
    ssl: number
    send: number
    wait: number
    receive: number
  }
  requestHeaders: HARHeader[]
  responseHeaders: HARHeader[]
  postData?: HARPostData
  responseContent?: HARContent
}

// Waterfall bar segment
export interface WaterfallSegment {
  name: string
  start: number
  duration: number
  color: string
}

