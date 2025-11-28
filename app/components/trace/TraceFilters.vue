<script setup lang="ts">
const { t } = useI18n()

const { filters, services, operations, setFilter, resetFilters } = useTraceStore()

const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'OK', label: 'OK' },
  { value: 'ERROR', label: 'Error' },
  { value: 'UNSET', label: 'Unset' }
]

const serviceOptions = computed(() => [
  { value: '', label: t('traces.filters.allServices') },
  ...services.value.map(s => ({ value: s, label: s }))
])

const operationOptions = computed(() => [
  { value: '', label: t('traces.filters.allOperations') },
  ...operations.value.map(o => ({ value: o, label: o }))
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Search -->
    <div class="flex-1 min-w-[200px]">
      <UInput
        :model-value="filters.search"
        :placeholder="t('traces.filters.searchPlaceholder')"
        icon="i-heroicons-magnifying-glass"
        @update:model-value="setFilter('search', $event)"
      />
    </div>

    <!-- Service -->
    <USelectMenu
      :model-value="filters.service"
      :items="serviceOptions"
      value-key="value"
      class="w-40"
      @update:model-value="setFilter('service', $event)"
    >
      <template #leading>
        <UIcon name="i-heroicons-server-stack" class="w-4 h-4" />
      </template>
    </USelectMenu>

    <!-- Operation -->
    <USelectMenu
      :model-value="filters.operation"
      :items="operationOptions"
      value-key="value"
      class="w-44"
      @update:model-value="setFilter('operation', $event)"
    >
      <template #leading>
        <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
      </template>
    </USelectMenu>

    <!-- Status -->
    <USelectMenu
      :model-value="filters.status"
      :items="statusOptions"
      value-key="value"
      class="w-32"
      @update:model-value="setFilter('status', $event)"
    >
      <template #leading>
        <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
      </template>
    </USelectMenu>

    <!-- Reset -->
    <UButton
      variant="ghost"
      icon="i-heroicons-arrow-path"
      @click="resetFilters"
    >
      {{ t('common.reset') }}
    </UButton>
  </div>
</template>

