<script setup lang="ts">
import type { FlameNode, CallTreeNode, BottomUpNode, HotFunction, TimelineEvent, SourceFile, ProfileViewMode } from '~/types/profile'

definePageMeta({
  layout: 'default',
})

const {
  hasProfile,
  fileName,
  isLoading,
  error,
  filter,
  viewMode,
  flameGraph,
  callTree,
  bottomUp,
  stats,
  summary,
  timeline,
  sourceFiles,
  filteredHotFunctions,
  filteredBottomUp,
  matchingNodeIds,
  selectedFunction,
  loadFile,
  setViewMode,
  setSearch,
  setMinPercentage,
  toggleHideIdle,
  toggleHideGC,
  toggleHideNative,
  selectFunction,
  setHoveredNode,
  toggleCallTreeNode,
  toggleBottomUpNode,
  reset,
} = useProfileStore()

const viewModes: Array<{ id: ProfileViewMode; label: string; icon: string }> = [
  { id: 'summary', label: 'Summary', icon: 'i-heroicons-chart-pie' },
  { id: 'flamegraph', label: 'Flame Graph', icon: 'i-heroicons-fire' },
  { id: 'calltree', label: 'Call Tree', icon: 'i-heroicons-rectangle-stack' },
  { id: 'bottomup', label: 'Bottom-Up', icon: 'i-heroicons-arrow-up' },
  { id: 'timeline', label: 'Timeline', icon: 'i-heroicons-chart-bar-square' },
  { id: 'source', label: 'Source', icon: 'i-heroicons-code-bracket' },
]

async function handleFileSelected(file: File) {
  try {
    await loadFile(file)
  } catch (e) {
    console.error('Error loading profile:', e)
  }
}

function handleNodeClick(node: FlameNode) {
  console.log('Node clicked:', node.name)
}

function handleCallTreeSelect(node: CallTreeNode) {
  const fn = filteredHotFunctions.value.find(f => f.id === node.id)
  if (fn) {
    selectFunction(fn)
  }
}

function handleBottomUpSelect(node: BottomUpNode) {
  console.log('Bottom-up selected:', node.name)
}

function handleTimelineClick(event: TimelineEvent) {
  const fn = filteredHotFunctions.value.find(f => f.id === event.nodeId)
  if (fn) {
    selectFunction(fn)
  }
}

function handleSourceFileSelect(file: SourceFile) {
  console.log('Source file selected:', file.fileName)
}
</script>

<template>
  <div class="min-h-screen bg-[var(--log-bg)]">
    <!-- Back navigation for upload screen -->
    <div v-if="!hasProfile && !isLoading" class="sticky top-0 z-30 bg-[var(--log-bg)]/95 backdrop-blur-sm border-b border-[var(--log-border)]">
      <div class="container mx-auto px-4 py-3 flex items-center gap-3">
        <NuxtLink to="/" class="flex items-center gap-2 text-[var(--log-text-muted)] hover:text-[#00DC82] transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <UIcon name="i-heroicons-fire" class="w-6 h-6 text-[#00DC82]" />
        <h1 class="text-xl font-semibold bg-gradient-to-r from-[#00DC82] to-[#36e89e] bg-clip-text text-transparent">
          Profile Viewer
        </h1>
      </div>
    </div>

    <!-- Upload Screen -->
    <ProfileUpload
      v-if="!hasProfile && !isLoading"
      @file-selected="handleFileSelected"
    />

    <!-- Loading -->
    <div v-else-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-[#00DC82] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p class="text-[var(--log-text)]">Processing profile...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen p-8">
      <div class="text-center max-w-md">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 class="text-xl font-bold text-[var(--log-text)] mb-2">Error processing profile</h2>
        <p class="text-[var(--log-text-muted)] mb-4">{{ error }}</p>
        <button
          class="px-4 py-2 bg-[#00DC82] text-black font-medium rounded-lg hover:bg-[#36e89e] transition-colors"
          @click="reset"
        >
          Try again
        </button>
      </div>
    </div>

    <!-- Profile Viewer -->
    <div v-else class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-[var(--log-bg)]/95 backdrop-blur-sm border-b border-[var(--log-border)]">
        <div class="container mx-auto px-4 py-3">
          <!-- Top row: file info and controls -->
          <div class="flex items-center gap-4 mb-3">
            <!-- Back button -->
            <NuxtLink to="/" class="p-2 hover:bg-[var(--log-surface)] rounded-lg transition-colors">
              <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 text-[var(--log-text-muted)]" />
            </NuxtLink>

            <!-- File info -->
            <div class="flex items-center gap-2 px-4 py-2 bg-[var(--log-surface)] rounded-lg border border-[var(--log-border)]">
              <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-[#00DC82]" />
              <span class="text-sm font-medium truncate max-w-[200px]" :title="fileName">{{ fileName }}</span>
              <button
                class="ml-2 p-1 hover:bg-[var(--log-surface-2)] rounded transition-colors"
                title="Load another file"
                @click="reset"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-[var(--log-text-muted)]" />
              </button>
            </div>

            <!-- Search -->
            <div class="flex-1 max-w-[400px]">
              <div class="relative">
                <UIcon
                  name="i-heroicons-magnifying-glass"
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--log-text-muted)]"
                />
                <input
                  :value="filter.search"
                  type="text"
                  placeholder="Search functions..."
                  class="w-full pl-10 pr-4 py-2.5 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-lg text-[var(--log-text)] placeholder-[var(--log-text-muted)] focus:outline-none focus:border-[#00DC82] focus:ring-1 focus:ring-[#00DC82]/20 font-mono text-sm transition-all"
                  @input="setSearch(($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Toggles -->
            <div class="flex items-center gap-2">
              <button
                class="px-3 py-2 text-sm rounded-lg transition-colors"
                :class="filter.hideIdle
                  ? 'bg-[#00DC82]/20 text-[#00DC82] border border-[#00DC82]/30'
                  : 'bg-[var(--log-surface)] text-[var(--log-text-muted)] border border-[var(--log-border)]'"
                @click="toggleHideIdle"
              >
                Hide Idle
              </button>
              <button
                class="px-3 py-2 text-sm rounded-lg transition-colors"
                :class="filter.hideGC
                  ? 'bg-[#00DC82]/20 text-[#00DC82] border border-[#00DC82]/30'
                  : 'bg-[var(--log-surface)] text-[var(--log-text-muted)] border border-[var(--log-border)]'"
                @click="toggleHideGC"
              >
                Hide GC
              </button>
              <button
                class="px-3 py-2 text-sm rounded-lg transition-colors"
                :class="filter.hideNative
                  ? 'bg-[#00DC82]/20 text-[#00DC82] border border-[#00DC82]/30'
                  : 'bg-[var(--log-surface)] text-[var(--log-text-muted)] border border-[var(--log-border)]'"
                @click="toggleHideNative"
              >
                Hide Native
              </button>
            </div>
          </div>

          <!-- View mode tabs -->
          <div class="flex gap-1">
            <button
              v-for="mode in viewModes"
              :key="mode.id"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              :class="viewMode === mode.id
                ? 'bg-[#00DC82] text-black'
                : 'bg-[var(--log-surface)] text-[var(--log-text-muted)] hover:text-[var(--log-text)] hover:bg-[var(--log-surface-2)]'"
              @click="setViewMode(mode.id)"
            >
              <UIcon :name="mode.icon" class="w-4 h-4" />
              {{ mode.label }}
            </button>
          </div>
        </div>
      </header>

      <!-- Main content area -->
      <div class="flex-1 p-6">
        <!-- Summary View -->
        <ProfileSummaryView
          v-if="viewMode === 'summary'"
          :summary="summary"
          :stats="stats"
        />

        <!-- Flame Graph View -->
        <div v-else-if="viewMode === 'flamegraph'" class="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div class="xl:col-span-3 bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl p-4">
            <ProfileFlameGraph
              :data="flameGraph"
              :matching-ids="matchingNodeIds"
              :selected-node-id="selectedFunction?.id"
              @node-click="handleNodeClick"
              @node-hover="setHoveredNode"
            />
          </div>
          <div class="space-y-4">
            <ProfileFunctionDetail
              v-if="selectedFunction"
              :func="selectedFunction"
              @close="selectFunction(null)"
            />
            <div class="bg-[var(--log-surface)] border border-[var(--log-border)] rounded-xl p-4 max-h-[400px] overflow-y-auto">
              <h3 class="text-sm font-semibold text-[var(--log-text)] mb-3 flex items-center gap-2">
                <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-[#00DC82]" />
                Hot Functions
              </h3>
              <div class="space-y-1">
                <div
                  v-for="fn in filteredHotFunctions.slice(0, 20)"
                  :key="fn.id"
                  class="p-2 rounded-lg hover:bg-[var(--log-surface-2)] cursor-pointer transition-colors text-sm"
                  :class="{ 'bg-[#00DC82]/10': selectedFunction?.id === fn.id }"
                  @click="selectFunction(fn)"
                >
                  <div class="font-mono text-[var(--log-text)] truncate">{{ fn.name }}</div>
                  <div class="text-xs text-[var(--log-text-muted)]">{{ fn.selfPercentage.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Call Tree View -->
        <div v-else-if="viewMode === 'calltree'" class="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div class="xl:col-span-3">
            <ProfileCallTree
              :data="callTree"
              :selected-id="selectedFunction?.id"
              @select="handleCallTreeSelect"
              @toggle="toggleCallTreeNode"
            />
          </div>
          <div>
            <ProfileFunctionDetail
              v-if="selectedFunction"
              :func="selectedFunction"
              @close="selectFunction(null)"
            />
          </div>
        </div>

        <!-- Bottom-Up View -->
        <div v-else-if="viewMode === 'bottomup'" class="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div class="xl:col-span-3">
            <ProfileBottomUpView
              :data="filteredBottomUp"
              @select="handleBottomUpSelect"
              @toggle="toggleBottomUpNode"
            />
          </div>
          <div>
            <ProfileFunctionDetail
              v-if="selectedFunction"
              :func="selectedFunction"
              @close="selectFunction(null)"
            />
          </div>
        </div>

        <!-- Timeline View -->
        <div v-else-if="viewMode === 'timeline'" class="space-y-6">
          <ProfileTimeline
            :data="timeline"
            :selected-node-id="selectedFunction?.id"
            @event-click="handleTimelineClick"
          />
          <ProfileHotFunctions
            :functions="filteredHotFunctions.slice(0, 30)"
            :selected-id="selectedFunction?.id"
            @select="selectFunction"
          />
        </div>

        <!-- Source View -->
        <ProfileSourceView
          v-else-if="viewMode === 'source'"
          :source-files="sourceFiles"
          :selected-function="selectedFunction"
          @select-file="handleSourceFileSelect"
          @select-function="selectFunction"
        />
      </div>
    </div>
  </div>
</template>
