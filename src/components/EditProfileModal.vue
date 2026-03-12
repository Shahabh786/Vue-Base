<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  userName: { type: String, required: true },
  userHandle: { type: String, required: true },
})

const emit = defineEmits(['close', 'save'])

const draftName = ref(props.userName)
const draftHandle = ref(props.userHandle)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    draftName.value = props.userName
    draftHandle.value = props.userHandle
  },
)

const initials = computed(() => {
  const parts = String(draftName.value).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'U'
})

function normalizeHandle(value) {
  const raw = String(value ?? '').trim().replace(/\s+/g, '')
  if (!raw) return '@user'
  return raw.startsWith('@') ? raw : `@${raw}`
}

function onSave() {
  const name = String(draftName.value).trim() || 'User'
  const handle = normalizeHandle(draftHandle.value)
  emit('save', { name, handle })
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
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-900/20">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white"
              aria-hidden="true"
            >
              {{ initials }}
            </div>
            <div>
              <h2 class="text-base font-semibold text-zinc-900">Edit Profile</h2>
              <p class="text-sm text-zinc-500">Update your display information</p>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-zinc-700">Name</span>
              <input
                v-model="draftName"
                type="text"
                class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="Your name"
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-zinc-700">Handle</span>
              <input
                v-model="draftHandle"
                type="text"
                class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="@username"
              />
            </label>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              @click="onSave"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

