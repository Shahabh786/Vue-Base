<script setup>
import { computed } from 'vue'
import { LogOut, Palette, Settings, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, required: true },
  expanded: { type: Boolean, required: true },
  userName: { type: String, required: true },
  userHandle: { type: String, required: true },
  userInitials: { type: String, required: true },
  userAvatarUrl: { type: String, default: '' },
})

const emit = defineEmits(['close', 'editProfile', 'selectAction'])

const items = computed(() => [
  { key: 'upgrade', label: 'Upgrade Plan', icon: Sparkles },
  { key: 'customize', label: 'Customization', icon: Palette },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'logout', label: 'Logout', icon: LogOut },
])
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-[0.98]"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition duration-120 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-[0.98]"
  >
    <div
      v-if="props.open"
      class="absolute bottom-full z-50 mb-2 origin-bottom rounded-xl border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10"
      :class="
        props.expanded ? 'left-0 right-0' : 'left-0 w-[220px] origin-bottom-left'
      "
      role="menu"
      aria-label="User menu"
    >
      <button
        type="button"
        class="mb-1 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[#eeeeee]"
        @click="emit('editProfile')"
      >
        <img
          v-if="props.userAvatarUrl"
          :src="props.userAvatarUrl"
          alt="User avatar"
          class="h-9 w-9 shrink-0 rounded-full object-cover"
        />
        <div
          v-else
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white"
          aria-hidden="true"
        >
          {{ props.userInitials }}
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-zinc-900">{{ props.userName }}</div>
          <div class="truncate text-xs text-zinc-500">{{ props.userHandle }}</div>
        </div>
      </button>

      <div class="mx-2 mb-1 border-t border-zinc-200/90" />

      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-[#eeeeee] hover:text-zinc-900"
        role="menuitem"
        @click="emit('selectAction', item.key)"
      >
        <component :is="item.icon" class="h-4 w-4 text-zinc-500" />
        <span class="truncate">{{ item.label }}</span>
      </button>
    </div>
  </Transition>
</template>

