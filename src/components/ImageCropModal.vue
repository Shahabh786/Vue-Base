<script setup>
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps({
  open: { type: Boolean, required: true },
  imageSrc: { type: String, default: '' },
})

const emit = defineEmits(['cancel', 'confirm'])
const cropperRef = ref(null)

function onConfirm() {
  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) return
  emit('confirm', canvas.toDataURL('image/jpeg', 0.92))
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 py-6"
        @click.self="emit('cancel')"
      >
        <div class="w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
          <div class="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
            <h3 class="text-base font-semibold text-zinc-100">Crop profile photo</h3>
            <button
              type="button"
              class="rounded-lg px-2 py-1 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              @click="emit('cancel')"
            >
              Close
            </button>
          </div>

          <div class="p-5">
            <div class="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <Cropper
                ref="cropperRef"
                class="cropper-surface h-[440px] w-full"
                :src="props.imageSrc"
                image-restriction="stencil"
                :transitions="false"
                :canvas="{ width: 512, height: 512 }"
                :move-image="{ mouse: true, touch: true }"
                :stencil-props="{
                  aspectRatio: 1,
                  movable: true,
                  resizable: true,
                  handlers: {},
                }"
              />
            </div>

            <div class="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                @click="emit('cancel')"
              >
                Cancel
              </button>
              <button
                type="button"
                class="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
                @click="onConfirm"
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:deep(.cropper-surface .vue-advanced-cropper__image),
:deep(.cropper-surface .vue-advanced-cropper__foreground),
:deep(.cropper-surface .vue-advanced-cropper__stencil-wrapper) {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

:deep(.cropper-surface .vue-advanced-cropper__line) {
  display: none;
}
</style>

