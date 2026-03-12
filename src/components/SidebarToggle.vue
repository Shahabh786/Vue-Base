<script setup>
import { PanelLeft } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: 'Toggle sidebar' },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    :title="title"
    class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-[#eeeeee] hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60"
    @click="$emit('click')"
  >
    <PanelLeft class="h-5 w-5" />
  </button>
</template>

