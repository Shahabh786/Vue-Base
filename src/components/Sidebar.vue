<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Home, X, PanelLeft } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import SidebarFooter from './SidebarFooter.vue'
import AppTooltip from './AppTooltip.vue'
import appLogo from '../assets/app-logo.png'

const props = defineProps({
  expanded: { type: Boolean, required: true },
  userMenuOpen: { type: Boolean, required: true },
})

const emit = defineEmits(['toggle', 'update:userMenuOpen', 'requestCloseOverlays'])

const route = useRoute()
const sidebarRef = ref(null)
const isCollapsedLogoHovering = ref(false)

const widthClass = computed(() => (props.expanded ? 'w-[280px]' : 'w-[56px]'))
const mobileTransformClass = computed(() =>
  props.expanded ? 'translate-x-0' : '-translate-x-full',
)

const navItems = computed(() => [
  { to: '/', label: 'Home', icon: Home },
])

function closeUserMenu() {
  if (props.userMenuOpen) emit('update:userMenuOpen', false)
}

function onDocumentPointerDown(e) {
  const el = sidebarRef.value
  if (!el) return
  if (!props.userMenuOpen) return
  if (el.contains(e.target)) return
  closeUserMenu()
}

function onSidebarClick(e) {
  if (props.expanded) return
  const target = e.target
  if (!(target instanceof Element)) return
  if (target.closest('a, button, [role="menuitem"]')) return
  emit('toggle')
}

watch(
  () => route.fullPath,
  () => emit('requestCloseOverlays'),
)

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<template>
  <aside
    ref="sidebarRef"
    class="fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-zinc-200 bg-[#f9f9f9] transition-[transform,width] duration-200 ease-in-out md:static md:z-auto md:translate-x-0"
    :class="[widthClass, mobileTransformClass, !props.expanded ? 'md:cursor-e-resize' : '']"
    @click="onSidebarClick"
  >
    <div
      class="flex items-center py-3"
      :class="props.expanded ? 'justify-between px-3' : 'justify-center px-0'"
    >
      <div v-if="props.expanded" class="flex min-w-0 items-center gap-2">
        <img :src="appLogo" alt="App logo" class="h-8 w-8 rounded-lg object-contain" loading="eager" decoding="async" />
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-zinc-900">BrokerDraft</div>
          <div class="truncate text-xs text-zinc-500">Smart Property Docs</div>
        </div>
      </div>
      <div
        v-else
        class="relative h-8 w-8 md:cursor-e-resize"
        @mouseenter="isCollapsedLogoHovering = true"
        @mouseleave="isCollapsedLogoHovering = false"
      >
        <img
          v-if="!isCollapsedLogoHovering"
          :src="appLogo"
          alt="App logo"
          class="h-8 w-8 rounded-lg object-contain"
          loading="eager"
          decoding="async"
        />
        <AppTooltip v-else text="Open sidebar" align="start">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8f8f8f] hover:bg-[#eeeeee] hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 md:cursor-e-resize"
            @click="emit('toggle')"
          >
            <PanelLeft class="h-5 w-5" />
          </button>
        </AppTooltip>
      </div>

      <AppTooltip v-if="props.expanded" text="Close sidebar">
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8f8f8f] transition hover:bg-[#eeeeee] hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 md:cursor-e-resize"
          @click="emit('toggle')"
        >
          <PanelLeft class="hidden h-4 w-4 md:block" />
          <X class="block h-4 w-4 md:hidden" />
        </button>
      </AppTooltip>
    </div>

    <nav class="flex-1" :class="props.expanded ? 'px-2' : 'px-0'">
      <div class="space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex cursor-pointer items-center rounded-xl text-sm text-zinc-700 transition hover:bg-[#eeeeee] hover:text-zinc-900"
          :class="[
            route.path === item.to ? 'text-zinc-900 font-medium' : '',
            props.expanded
              ? 'gap-3 px-3 py-2'
              : 'mx-auto h-10 w-10 justify-center px-0 py-0',
          ]"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0 text-zinc-500 group-hover:text-zinc-700" />
          <span v-if="props.expanded" class="truncate">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <div :class="props.expanded ? 'px-2 pb-3 pt-2' : 'px-1 pb-3 pt-2'">
      <SidebarFooter
        :expanded="props.expanded"
        :user-menu-open="props.userMenuOpen"
        user-name="Shahab Haidar"
        @update:user-menu-open="emit('update:userMenuOpen', $event)"
      />
    </div>
  </aside>
</template>

