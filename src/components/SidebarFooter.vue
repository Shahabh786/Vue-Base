<script setup>
import { computed, ref } from 'vue'
import EditProfileModal from './EditProfileModal.vue'
import UserPopover from './UserPopover.vue'

const props = defineProps({
  expanded: { type: Boolean, required: true },
  userMenuOpen: { type: Boolean, required: true },
  userName: { type: String, default: 'Shahab Haidar' },
})

const emit = defineEmits(['update:userMenuOpen'])
const currentUserName = ref(props.userName)
const currentUserHandle = ref('@shahab.haidar')
const isEditProfileOpen = ref(false)

const initials = computed(() => {
  const parts = String(currentUserName.value).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'U'
})

function toggleMenu() {
  emit('update:userMenuOpen', !props.userMenuOpen)
}

function closeMenu() {
  emit('update:userMenuOpen', false)
}

function onEditProfile() {
  closeMenu()
  isEditProfileOpen.value = true
}

function onSaveProfile({ name, handle }) {
  currentUserName.value = name
  currentUserHandle.value = handle
  isEditProfileOpen.value = false
}
</script>

<template>
  <div class="relative">
    <UserPopover
      :open="props.userMenuOpen"
      :expanded="props.expanded"
      :user-name="currentUserName"
      :user-handle="currentUserHandle"
      :user-initials="initials"
      @close="closeMenu"
      @edit-profile="onEditProfile"
    />

    <EditProfileModal
      :open="isEditProfileOpen"
      :user-name="currentUserName"
      :user-handle="currentUserHandle"
      @close="isEditProfileOpen = false"
      @save="onSaveProfile"
    />

    <button
      type="button"
      class="flex w-full cursor-pointer items-center rounded-xl text-left transition hover:bg-[#eeeeee] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60"
      :class="props.expanded ? 'gap-3 px-2 py-2' : 'justify-center px-0 py-2'"
      @click="toggleMenu"
    >
      <div
        class="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white"
        aria-hidden="true"
      >
        {{ initials }}
      </div>

      <div v-if="props.expanded" class="min-w-0 flex-1">
        <div class="truncate text-sm font-medium text-zinc-900">{{ currentUserName }}</div>
      </div>

      <div v-if="props.expanded" class="text-xs text-zinc-500">⋯</div>
    </button>
  </div>
</template>

