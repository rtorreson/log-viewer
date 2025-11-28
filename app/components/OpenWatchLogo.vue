<script setup lang="ts">
defineProps<{
  size?: string | number
  class?: string
}>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    :width="size || 64"
    :height="size || 64"
    :class="$props.class"
  >
    <!-- Outer ring -->
    <circle
      cx="32"
      cy="32"
      r="28"
      stroke="currentColor"
      stroke-width="3"
      fill="currentColor"
      fill-opacity="0.1"
    />
    
    <!-- Middle ring -->
    <circle
      cx="32"
      cy="32"
      r="18"
      stroke="currentColor"
      stroke-width="2"
      stroke-opacity="0.5"
    />
    
    <!-- Center dot -->
    <circle
      cx="32"
      cy="32"
      r="8"
      fill="currentColor"
    />
    
    <!-- Crosshairs -->
    <path
      d="M32 4V12"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M32 52V60"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M4 32H12"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M52 32H60"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
</template>

