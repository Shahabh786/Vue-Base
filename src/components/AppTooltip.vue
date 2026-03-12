<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  align: { type: String, default: 'center' },
})

const alignmentClass = computed(() => {
  if (props.align === 'start') return 'left-0 translate-x-0'
  if (props.align === 'end') return 'right-0 translate-x-0'
  return 'left-1/2 -translate-x-1/2'
})
</script>

<template>
  <div class="group relative inline-flex">
    <slot />
    <div
      class="pointer-events-none absolute top-full z-50 mt-2 hidden whitespace-nowrap rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100 md:block"
      :class="alignmentClass"
      role="tooltip"
    >
      {{ text }}
    </div>
  </div>
</template>

