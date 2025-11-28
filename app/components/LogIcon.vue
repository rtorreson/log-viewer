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
    <!-- Document base -->
    <path
      d="M12 8C12 5.79086 13.7909 4 16 4H36L52 20V56C52 58.2091 50.2091 60 48 60H16C13.7909 60 12 58.2091 12 56V8Z"
      fill="currentColor"
      fill-opacity="0.15"
    />
    <path
      d="M12 8C12 5.79086 13.7909 4 16 4H36L52 20V56C52 58.2091 50.2091 60 48 60H16C13.7909 60 12 58.2091 12 56V8Z"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    
    <!-- Folded corner -->
    <path
      d="M36 4V16C36 18.2091 37.7909 20 40 20H52"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    
    <!-- Log lines -->
    <path
      d="M20 30H44"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    />
    <path
      d="M20 38H38"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    />
    <path
      d="M20 46H42"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    />
    
    <!-- Magnifier glass -->
    <circle
      cx="46"
      cy="46"
      r="10"
      fill="#0a0a0f"
      stroke="currentColor"
      stroke-width="2.5"
    />
    <circle
      cx="46"
      cy="46"
      r="6"
      stroke="currentColor"
      stroke-width="2"
      stroke-opacity="0.5"
    />
    <path
      d="M53 53L58 58"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    />
  </svg>
</template>

