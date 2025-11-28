import type { 
  HARFile, 
  HAREntry, 
  ProcessedEntry, 
  NetworkStats, 
  ResourceType,
  WaterfallSegment 
} from '~/types/network'

export function useHARParser() {
  
  // Detect resource type from MIME type and URL
  function detectResourceType(entry: HAREntry): ResourceType {
    const mimeType = entry.response.content.mimeType.toLowerCase()
    const url = entry.request.url.toLowerCase()
    
    // Check headers for fetch/xhr
    const requestHeaders = entry.request.headers
    const xhrHeader = requestHeaders.find(h => 
      h.name.toLowerCase() === 'x-requested-with' && 
      h.value.toLowerCase() === 'xmlhttprequest'
    )
    if (xhrHeader) return 'xhr'
    
    // Check accept header for fetch
    const acceptHeader = requestHeaders.find(h => h.name.toLowerCase() === 'accept')
    if (acceptHeader?.value.includes('application/json')) return 'fetch'
    
    // By MIME type
    if (mimeType.includes('html')) return 'document'
    if (mimeType.includes('css')) return 'stylesheet'
    if (mimeType.includes('javascript') || mimeType.includes('ecmascript')) return 'script'
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.includes('font') || url.match(/\.(woff2?|ttf|otf|eot)(\?|$)/)) return 'font'
    if (mimeType.includes('json') || mimeType.includes('xml')) return 'fetch'
    if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) return 'media'
    if (mimeType.includes('manifest')) return 'manifest'
    
    // By URL extension
    if (url.match(/\.css(\?|$)/)) return 'stylesheet'
    if (url.match(/\.js(\?|$)/)) return 'script'
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/)) return 'image'
    if (url.match(/\.(woff2?|ttf|otf|eot)(\?|$)/)) return 'font'
    
    return 'other'
  }

  // Extract domain from URL
  function getDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return 'unknown'
    }
  }

  // Get filename from URL
  function getFilename(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split('/').pop() || pathname
      return filename || urlObj.hostname
    } catch {
      return url.slice(0, 50)
    }
  }

  // Parse HAR file
  function parseHAR(content: string): { entries: ProcessedEntry[], stats: NetworkStats } {
    const har: HARFile = JSON.parse(content)
    
    if (!har.log || !har.log.entries) {
      throw new Error('Invalid HAR file format')
    }
    
    const rawEntries = har.log.entries
    
    // Find earliest start time
    const startTimes = rawEntries.map(e => new Date(e.startedDateTime).getTime())
    const earliestTime = Math.min(...startTimes)
    
    // Process entries
    const entries: ProcessedEntry[] = rawEntries.map((entry, index) => {
      const startTime = new Date(entry.startedDateTime).getTime()
      const resourceType = detectResourceType(entry)
      
      // Calculate transfer size
      const transferSize = entry.response._transferSize || 
        entry.response.headersSize + entry.response.bodySize
      
      // Normalize timings (some values might be -1 meaning not applicable)
      const timings = {
        blocked: Math.max(0, entry.timings.blocked || 0),
        dns: Math.max(0, entry.timings.dns || 0),
        connect: Math.max(0, entry.timings.connect || 0),
        ssl: Math.max(0, entry.timings.ssl || 0),
        send: Math.max(0, entry.timings.send || 0),
        wait: Math.max(0, entry.timings.wait || 0),
        receive: Math.max(0, entry.timings.receive || 0)
      }
      
      return {
        id: `entry-${index}`,
        url: entry.request.url,
        name: getFilename(entry.request.url),
        domain: getDomain(entry.request.url),
        method: entry.request.method,
        status: entry.response.status,
        statusText: entry.response.statusText,
        type: resourceType,
        mimeType: entry.response.content.mimeType,
        size: entry.response.content.size,
        transferSize,
        time: entry.time,
        startTime,
        endTime: startTime + entry.time,
        startOffset: startTime - earliestTime,
        timings,
        requestHeaders: entry.request.headers,
        responseHeaders: entry.response.headers,
        postData: entry.request.postData,
        responseContent: entry.response.content
      }
    })
    
    // Sort by start time
    entries.sort((a, b) => a.startTime - b.startTime)
    
    // Calculate stats
    const stats = calculateStats(entries, har.log.pages?.[0])
    
    return { entries, stats }
  }

  // Calculate network statistics
  function calculateStats(
    entries: ProcessedEntry[], 
    page?: { pageTimings?: { onContentLoad?: number; onLoad?: number } }
  ): NetworkStats {
    const totalRequests = entries.length
    const totalTransferred = entries.reduce((sum, e) => sum + e.transferSize, 0)
    const totalResources = entries.reduce((sum, e) => sum + e.size, 0)
    
    // Calculate total time
    const endTimes = entries.map(e => e.endTime)
    const startTimes = entries.map(e => e.startTime)
    const totalTime = endTimes.length > 0 
      ? Math.max(...endTimes) - Math.min(...startTimes)
      : 0
    
    // Type breakdown
    const typeMap = new Map<ResourceType, { count: number; size: number }>()
    for (const entry of entries) {
      const current = typeMap.get(entry.type) || { count: 0, size: 0 }
      current.count++
      current.size += entry.size
      typeMap.set(entry.type, current)
    }
    
    const typeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
      percentage: (data.count / totalRequests) * 100
    })).sort((a, b) => b.count - a.count)
    
    // Status breakdown
    const statusMap = new Map<string, number>()
    for (const entry of entries) {
      const statusGroup = `${Math.floor(entry.status / 100)}xx`
      statusMap.set(statusGroup, (statusMap.get(statusGroup) || 0) + 1)
    }
    
    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: (count / totalRequests) * 100
    })).sort((a, b) => a.status.localeCompare(b.status))
    
    // Domain breakdown
    const domainMap = new Map<string, { count: number; size: number }>()
    for (const entry of entries) {
      const current = domainMap.get(entry.domain) || { count: 0, size: 0 }
      current.count++
      current.size += entry.size
      domainMap.set(entry.domain, current)
    }
    
    const domainBreakdown = Array.from(domainMap.entries()).map(([domain, data]) => ({
      domain,
      count: data.count,
      size: data.size
    })).sort((a, b) => b.count - a.count)
    
    return {
      totalRequests,
      totalTransferred,
      totalResources,
      totalTime,
      domContentLoaded: page?.pageTimings?.onContentLoad,
      pageLoad: page?.pageTimings?.onLoad,
      typeBreakdown,
      statusBreakdown,
      domainBreakdown
    }
  }

  // Generate waterfall segments for an entry
  function getWaterfallSegments(entry: ProcessedEntry): WaterfallSegment[] {
    const segments: WaterfallSegment[] = []
    let offset = 0
    
    if (entry.timings.blocked > 0) {
      segments.push({
        name: 'Blocked',
        start: offset,
        duration: entry.timings.blocked,
        color: '#94a3b8' // Slate
      })
      offset += entry.timings.blocked
    }
    
    if (entry.timings.dns > 0) {
      segments.push({
        name: 'DNS',
        start: offset,
        duration: entry.timings.dns,
        color: '#22d3ee' // Cyan
      })
      offset += entry.timings.dns
    }
    
    if (entry.timings.connect > 0) {
      segments.push({
        name: 'Connect',
        start: offset,
        duration: entry.timings.connect,
        color: '#f97316' // Orange
      })
      offset += entry.timings.connect
    }
    
    if (entry.timings.ssl > 0) {
      segments.push({
        name: 'SSL',
        start: offset,
        duration: entry.timings.ssl,
        color: '#a855f7' // Purple
      })
      offset += entry.timings.ssl
    }
    
    if (entry.timings.send > 0) {
      segments.push({
        name: 'Send',
        start: offset,
        duration: entry.timings.send,
        color: '#3b82f6' // Blue
      })
      offset += entry.timings.send
    }
    
    if (entry.timings.wait > 0) {
      segments.push({
        name: 'Wait',
        start: offset,
        duration: entry.timings.wait,
        color: '#22c55e' // Green
      })
      offset += entry.timings.wait
    }
    
    if (entry.timings.receive > 0) {
      segments.push({
        name: 'Receive',
        start: offset,
        duration: entry.timings.receive,
        color: '#06b6d4' // Teal
      })
    }
    
    return segments
  }

  // Format bytes for display
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`
  }

  // Format time for display
  function formatTime(ms: number): string {
    if (ms < 1) {
      return `${(ms * 1000).toFixed(0)}μs`
    } else if (ms < 1000) {
      return `${ms.toFixed(0)}ms`
    } else {
      return `${(ms / 1000).toFixed(2)}s`
    }
  }

  // Get status color
  function getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return '#22c55e' // Green
    if (status >= 300 && status < 400) return '#3b82f6' // Blue
    if (status >= 400 && status < 500) return '#f59e0b' // Yellow
    if (status >= 500) return '#ef4444' // Red
    return '#6b7280' // Gray
  }

  // Get resource type icon
  function getTypeIcon(type: ResourceType): string {
    const icons: Record<ResourceType, string> = {
      document: 'i-heroicons-document-text',
      stylesheet: 'i-heroicons-paint-brush',
      script: 'i-heroicons-code-bracket',
      image: 'i-heroicons-photo',
      font: 'i-heroicons-language',
      xhr: 'i-heroicons-arrow-path',
      fetch: 'i-heroicons-arrow-down-tray',
      websocket: 'i-heroicons-signal',
      manifest: 'i-heroicons-document',
      media: 'i-heroicons-play',
      other: 'i-heroicons-question-mark-circle'
    }
    return icons[type] || icons.other
  }

  // Get resource type color
  function getTypeColor(type: ResourceType): string {
    const colors: Record<ResourceType, string> = {
      document: '#3b82f6',
      stylesheet: '#a855f7',
      script: '#f59e0b',
      image: '#22c55e',
      font: '#ec4899',
      xhr: '#06b6d4',
      fetch: '#06b6d4',
      websocket: '#8b5cf6',
      manifest: '#6b7280',
      media: '#ef4444',
      other: '#6b7280'
    }
    return colors[type] || colors.other
  }

  return {
    parseHAR,
    getWaterfallSegments,
    formatBytes,
    formatTime,
    getStatusColor,
    getTypeIcon,
    getTypeColor,
    getDomain,
    getFilename
  }
}

