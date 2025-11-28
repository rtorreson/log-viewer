<script setup lang="ts">
import type { TimelineData, TimelineEvent } from '~/types/profile'

const props = defineProps<{
  data: TimelineData | null
  selectedNodeId?: number
}>()

const emit = defineEmits<{
  eventClick: [event: TimelineEvent]
}>()

const { formatTime, getColor } = useProfileParser()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(1000)

const rowHeight = 24
const headerHeight = 40

const tooltip = ref<{
  visible: boolean
  x: number
  y: number
  event: TimelineEvent | null
}>({
  visible: false,
  x: 0,
  y: 0,
  event: null,
})

const svgHeight = computed(() => {
  if (!props.data) return 100
  return headerHeight + (props.data.maxDepth + 1) * rowHeight + 20
})

// Calculate visible events
const visibleEvents = computed(() => {
  if (!props.data) return []
  
  const duration = props.data.duration
  const minEventWidth = 2 // Minimum pixels to render
  const minDuration = (minEventWidth / containerWidth.value) * duration
  
  return props.data.events
    .filter(e => e.duration >= minDuration)
    .map(event => ({
      ...event,
      x: (event.startTime / duration) * containerWidth.value,
      width: Math.max((event.duration / duration) * containerWidth.value, 2),
      y: headerHeight + event.depth * rowHeight,
    }))
})

// Time markers
const timeMarkers = computed(() => {
  if (!props.data) return []
  
  const duration = props.data.duration
  const numMarkers = 10
  const interval = duration / numMarkers
  
  return Array.from({ length: numMarkers + 1 }, (_, i) => ({
    time: i * interval,
    x: (i * interval / duration) * containerWidth.value,
    label: formatTime(i * interval),
  }))
})

function handleEventHover(event: MouseEvent, timelineEvent: TimelineEvent | null) {
  if (timelineEvent) {
    tooltip.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      event: timelineEvent,
    }
  } else {
    tooltip.value.visible = false
  }
}

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth - 20
  }
})
</script>

<template>
  <div ref="containerRef" class="timeline-container">
    <svg
      v-if="data"
      :width="containerWidth + 20"
      :height="svgHeight"
      class="timeline-svg"
    >
      <!-- Time axis -->
      <g>
        <line
          :x1="10"
          :y1="headerHeight - 10"
          :x2="containerWidth + 10"
          :y2="headerHeight - 10"
          stroke="var(--log-border)"
          stroke-width="1"
        />
        
        <!-- Time markers -->
        <g v-for="marker in timeMarkers" :key="marker.time">
          <line
            :x1="marker.x + 10"
            :y1="headerHeight - 15"
            :x2="marker.x + 10"
            :y2="headerHeight - 5"
            stroke="var(--log-border)"
            stroke-width="1"
          />
          <text
            :x="marker.x + 10"
            :y="headerHeight - 20"
            class="time-label"
            text-anchor="middle"
          >
            {{ marker.label }}
          </text>
        </g>
      </g>

      <!-- Events -->
      <g transform="translate(10, 0)">
        <rect
          v-for="event in visibleEvents"
          :key="`${event.nodeId}-${event.startTime}`"
          :x="event.x"
          :y="event.y"
          :width="event.width"
          :height="rowHeight - 4"
          :fill="getColor(event.name)"
          rx="2"
          class="timeline-event"
          :class="{ 'selected': selectedNodeId === event.nodeId }"
          @click="emit('eventClick', event)"
          @mouseenter="(e) => handleEventHover(e, event)"
          @mouseleave="handleEventHover($event, null)"
        />
      </g>
    </svg>

    <!-- Empty state -->
    <div v-else class="text-center py-12 text-[var(--log-text-muted)]">
      <UIcon name="i-heroicons-chart-bar-square" class="w-12 h-12 mx-auto mb-3 opacity-50" />
      <p>Nenhum dado de timeline disponível</p>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible && tooltip.event"
        class="timeline-tooltip"
        :style="{
          left: tooltip.x + 10 + 'px',
          top: tooltip.y + 10 + 'px',
        }"
      >
        <div class="font-semibold text-[var(--log-text)] mb-1">
          {{ tooltip.event.name }}
        </div>
        <div class="text-sm text-[var(--log-text-muted)] space-y-0.5">
          <div>Início: {{ formatTime(tooltip.event.startTime) }}</div>
          <div>Duração: {{ formatTime(tooltip.event.duration) }}</div>
          <div>Profundidade: {{ tooltip.event.depth }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.timeline-container {
  width: 100%;
  overflow-x: auto;
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 12px;
  padding: 10px;
}

.timeline-svg {
  display: block;
}

.time-label {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--log-text-muted);
}

.timeline-event {
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.timeline-event:hover {
  filter: brightness(1.2);
}

.timeline-event.selected {
  stroke: var(--nuxt-green);
  stroke-width: 2;
}

.timeline-tooltip {
  position: fixed;
  z-index: 9999;
  background: var(--log-surface);
  border: 1px solid var(--log-border);
  border-radius: 8px;
  padding: 12px;
  max-width: 300px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
</style>

