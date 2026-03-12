<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { resolveUserAvatarUrl } from '../lib/media'
import EditProfileModal from './EditProfileModal.vue'
import UserPopover from './UserPopover.vue'

const props = defineProps({
  expanded: { type: Boolean, required: true },
  userMenuOpen: { type: Boolean, required: true },
  userName: { type: String, default: 'Shahab Haidar' },
})

const emit = defineEmits(['update:userMenuOpen'])
const router = useRouter()
const { clearSession, updateUser, user } = useAuth()
const isEditProfileOpen = ref(false)

const currentUserName = computed(
  () => user.value?.fullName || user.value?.loginName || props.userName || 'User',
)
const currentUserHandle = computed(() => {
  const loginName = String(user.value?.loginName ?? '').trim()
  return loginName ? `@${loginName}` : '@user'
})
const currentUserAvatarUrl = computed(() => resolveUserAvatarUrl(user.value?.profilePhoto))
const modalUser = computed(() => ({
  fullName: currentUserName.value,
  loginName: String(user.value?.loginName ?? '').trim(),
  email: String(user.value?.email ?? '').trim(),
  mobileNumber: String(user.value?.mobileNumber ?? '').trim(),
  profilePhoto: String(user.value?.profilePhoto ?? '').trim(),
}))

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

function onSaveProfile(nextUser) {
  updateUser(nextUser)
  isEditProfileOpen.value = false
}

async function onPopoverAction(actionKey) {
  if (actionKey === 'logout') {
    clearSession()
    closeMenu()
    await router.replace('/login')
    return
  }
  closeMenu()
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
      :user-avatar-url="currentUserAvatarUrl"
      @close="closeMenu"
      @edit-profile="onEditProfile"
      @select-action="onPopoverAction"
    />

    <EditProfileModal
      :open="isEditProfileOpen"
      :user="modalUser"
      @close="isEditProfileOpen = false"
      @save="onSaveProfile"
    />

    <button
      type="button"
      class="flex w-full cursor-pointer items-center rounded-xl text-left transition hover:bg-[#eeeeee] focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60"
      :class="props.expanded ? 'gap-3 px-2 py-2' : 'justify-center px-0 py-2'"
      @click="toggleMenu"
    >
      <img
        v-if="currentUserAvatarUrl"
        :src="currentUserAvatarUrl"
        alt="User avatar"
        class="h-9 w-9 rounded-full object-cover"
      />
      <div
        v-else
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

