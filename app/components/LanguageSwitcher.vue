<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map(l => ({
    value: l.code,
    label: l.name
  }))
})
</script>

<template>
  <USelectMenu
    :model-value="locale"
    :items="availableLocales"
    value-key="value"
    class="w-32"
    @update:model-value="setLocale($event)"
  >
    <template #leading>
      <UIcon name="i-heroicons-language" class="w-4 h-4" />
    </template>
  </USelectMenu>
</template>

