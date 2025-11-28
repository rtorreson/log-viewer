<script setup lang="ts">
import type { FlameNode } from '~/types/profile'

const props = defineProps<{
  data: FlameNode | null
  matchingIds?: Set<number>
  selectedNodeId?: number
}>()

const emit = defineEmits<{
  nodeClick: [node: FlameNode]
  nodeHover: [node: FlameNode | null]
}>()

const { formatTime, formatPercentage } = useProfileParser()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1000)
const rowHeight = 20
const minWidthToShow = 0.001 // 0.1% minimum width to render

const zoomStack = ref<FlameNode[]>([])
const currentRoot = computed(() => {
  return zoomStack.value.length > 0 
    ? zoomStack.value[zoomStack.value.length - 1] 
    : props.data
})

const tooltip = ref<{
  visible: boolean
  x: number
  y: number
  node: FlameNode | null
}>({
  visible: false,
  x: 0,
  y: 0,
  node: null,
})

// Flatten nodes for rendering
const flattenedNodes = computed(() => {
  if (!currentRoot.value) return []

  const nodes: Array<{
    node: FlameNode
    x: number
    width: number
    depth: number
  }> = []

  const baseX = currentRoot.value.x
  const baseWidth = currentRoot.value.width

  function flatten(node: FlameNode, relativeX: number, scale: number, depth: number) {
    const scaledWidth = node.width * scale
    if (scaledWidth < minWidthToShow) return

    const x = (relativeX - baseX) / baseWidth
    const width = scaledWidth / baseWidth

    nodes.push({ node, x, width, depth })

    let childX = relativeX
    for (const child of node.children) {
      flatten(child, childX, scale, depth + 1)
      childX += child.width
    }
  }

  flatten(currentRoot.value, currentRoot.value.x, 1, 0)
  return nodes
})

const maxDepth = computed(() => {
  return flattenedNodes.value.reduce((max, n) => Math.max(max, n.depth), 0)
})

const svgHeight = computed(() => (maxDepth.value + 1) * rowHeight + 10)

function handleNodeClick(node: FlameNode) {
  if (node.children.length > 0) {
    zoomStack.value.push(node)
  }
  emit('nodeClick', node)
}

function handleNodeHover(event: MouseEvent, node: FlameNode | null) {
  if (node) {
    tooltip.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      node,
    }
  } else {
    tooltip.value.visible = false
    tooltip.value.node = null
  }
  emit('nodeHover', node)
}

function zoomOut() {
  if (zoomStack.value.length > 0) {
    zoomStack.value.pop()
  }
}

function resetZoom() {
  zoomStack.value = []
}

function isMatching(nodeId: number): boolean {
  return props.matchingIds?.has(nodeId) || false
}

function isSelected(nodeId: number): boolean {
  return props.selectedNodeId === nodeId
}

function getNodeOpacity(node: FlameNode): number {
  if (props.matchingIds && props.matchingIds.size > 0) {
    return isMatching(node.id) ? 1 : 0.3
  }
  return 1
}

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth
  }
})
</script>

<template>
  <div ref="containerRef" class="flame-graph-container">
    <!-- Controls -->
    <div v-if="zoomStack.length > 0" class="flex items-center gap-2 mb-3">
      <button
        class="px-3 py-1.5 text-sm bg-[var(--log-surface-2)] hover:bg-[var(--log-border)] rounded-lg transition-colors flex items-center gap-2"
        @click="zoomOut"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Voltar
      </button>
      <button
        class="px-3 py-1.5 text-sm bg-[var(--log-surface-2)] hover:bg-[var(--log-border)] rounded-lg transition-colors"
        @click="resetZoom"
      >
        Reset Zoom
      </button>
      <span class="text-sm text-[var(--log-text-muted)]">
        Zoom: {{ currentRoot?.name }}
      </span>
    </div>

    <!-- Flame Graph SVG -->
    <svg
      v-if="data"
      :width="containerWidth"
      :height="svgHeight"
      class="flame-graph-svg"
    >
      <g
        v-for="({ node, x, width, depth }, index) in flattenedNodes"
        :key="node.id"
        :transform="`translate(${x * containerWidth}, ${depth * rowHeight})`"
        class="flame-node"
        :class="{
          'matching': isMatching(node.id),
          'selected': isSelected(node.id),
        }"
        @click="handleNodeClick(node)"
        @mouseenter="(e) => handleNodeHover(e, node)"
        @mouseleave="handleNodeHover($event, null)"
      >
        <rect
          :width="Math.max(width * containerWidth - 1, 0)"
          :height="rowHeight - 2"
          :fill="node.color"
          :opacity="getNodeOpacity(node)"
          rx="2"
          class="flame-rect"
        />
        <text
          v-if="width * containerWidth > 40"
          :x="4"
          :y="rowHeight / 2 + 3"
          class="flame-text"
        >
          {{ node.name.length > width * containerWidth / 7 
            ? node.name.slice(0, Math.floor(width * containerWidth / 7)) + '...' 
            : node.name 
          }}
        </text>
      </g>
    </svg>

    <!-- Empty state -->
    <div v-else class="text-center py-12 text-[var(--log-text-muted)]">
      <UIcon name="i-heroicons-fire" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Nenhum dado de flame graph disponível</p>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible && tooltip.node"
        class="flame-tooltip"
        :style="{
          left: tooltip.x + 10 + 'px',
          top: tooltip.y + 10 + 'px',
        }"
      >
        <div class="font-semibold text-[var(--log-text)] mb-1">
          {{ tooltip.node.name }}
        </div>
        <div class="text-sm text-[var(--log-text-muted)] space-y-0.5">
          <div>Self: {{ formatTime(tooltip.node.value) }} ({{ formatPercentage(tooltip.node.selfPercentage) }})</div>
          <div>Total: {{ formatTime(tooltip.node.totalValue) }} ({{ formatPercentage(tooltip.node.percentage) }})</div>
          <div v-if="tooltip.node.callFrame?.url" class="truncate max-w-[300px]">
            {{ tooltip.node.callFrame.url }}:{{ tooltip.node.callFrame.lineNumber }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.flame-graph-container {
  width: 100%;
  overflow-x: auto;
}

.flame-graph-svg {
  display: block;
}

.flame-node {
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.flame-node:hover .flame-rect {
  filter: brightness(1.2);
}

.flame-node.selected .flame-rect {
  stroke: var(--nuxt-green);
  stroke-width: 2;
}

.flame-node.matching .flame-rect {
  stroke: var(--nuxt-green);
  stroke-width: 1;
}

.flame-text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: white;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.flame-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 8px;
  padding: 12px;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
</style>

