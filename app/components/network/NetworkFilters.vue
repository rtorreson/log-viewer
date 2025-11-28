<script setup lang="ts">
const { t } = useI18n()

const { filters, domains, resourceTypes, setFilter, resetFilters } = useNetworkStore()

const typeOptions = computed(() => [
  { value: 'all', label: t('network.filters.allTypes') },
  ...resourceTypes.value.map(type => ({ value: type, label: type }))
])

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: '2xx', label: '2xx Success' },
  { value: '3xx', label: '3xx Redirect' },
  { value: '4xx', label: '4xx Client Error' },
  { value: '5xx', label: '5xx Server Error' }
]

const domainOptions = computed(() => [
  { value: '', label: 'All Domains' },
  ...domains.value.map(d => ({ value: d, label: d }))
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Search -->
    <div class="flex-1 min-w-[200px]">
      <UInput
        :model-value="filters.search"
        :placeholder="t('network.filters.searchPlaceholder')"
        icon="i-heroicons-magnifying-glass"
        @update:model-value="setFilter('search', $event)"
      />
    </div>

    <!-- Type -->
    <USelectMenu
      :model-value="filters.type"
      :items="typeOptions"
      value-key="value"
      class="w-36"
      @update:model-value="setFilter('type', $event)"
    >
      <template #leading>
        <UIcon name="i-heroicons-funnel" class="w-4 h-4" />
      </template>
    </USelectMenu>

    <!-- Status -->
    <USelectMenu
      :model-value="filters.status"
      :items="statusOptions"
      value-key="value"
      class="w-40"
      @update:model-value="setFilter('status', $event)"
    >
      <template #leading>
        <UIcon name="i-heroicons-signal" class="w-4 h-4" />
      </template>
    </USelectMenu>

    <!-- Domain -->
    <USelectMenu
      :model-value="filters.domain"
      :items="domainOptions"
      value-key="value"
      class="w-44"
      @update:model-value="setFilter('domain', $event)"
    >
      <template #leading>
        <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
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

