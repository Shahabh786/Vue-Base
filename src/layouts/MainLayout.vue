<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { X } from 'lucide-vue-next'
import Sidebar from '../components/Sidebar.vue'
import appLogo from '../assets/app-logo.png'

const isDesktop = ref(true)
const desktopSidebarExpanded = ref(true)
const mobileSidebarOpen = ref(false)
const isUserMenuOpen = ref(false)

const sidebarExpanded = computed(() => (isDesktop.value ? desktopSidebarExpanded.value : mobileSidebarOpen.value))

function toggleSidebar() {
  if (isDesktop.value) desktopSidebarExpanded.value = !desktopSidebarExpanded.value
  else mobileSidebarOpen.value = !mobileSidebarOpen.value
}

function openMobileSidebar() {
  mobileSidebarOpen.value = true
}

function closeMobileSidebar() {
  if (!isDesktop.value) mobileSidebarOpen.value = false
}

function closeOverlays() {
  isUserMenuOpen.value = false
}

function closeAllOverlays() {
  closeOverlays()
  closeMobileSidebar()
}

function onKeyDown(e) {
  const key = e.key?.toLowerCase?.() ?? ''
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const modPressed = isMac ? e.metaKey : e.ctrlKey

  if (modPressed && key === 'b') {
    e.preventDefault()
    toggleSidebar()
    return
  }

  if (key === 'escape') {
    closeAllOverlays()
  }
}

function updateMediaState() {
  isDesktop.value = window.matchMedia('(min-width: 768px)').matches
  if (!isDesktop.value) mobileSidebarOpen.value = false
}

onMounted(() => {
  updateMediaState()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', updateMediaState)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', updateMediaState)
})
</script>

<template>
  <div class="relative flex h-screen w-screen overflow-hidden bg-white">
    <div
      v-if="!isDesktop && mobileSidebarOpen"
      class="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
      @click="closeAllOverlays"
    />

    <Sidebar
      :expanded="sidebarExpanded"
      :user-menu-open="isUserMenuOpen"
      @toggle="toggleSidebar"
      @update:user-menu-open="isUserMenuOpen = $event"
      @request-close-overlays="closeAllOverlays"
    />

    <main class="flex min-w-0 flex-1 flex-col bg-white">
      <header
        class="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-zinc-200 bg-white/80 px-3 backdrop-blur md:hidden"
      >
        <button
          type="button"
          :aria-label="mobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8f8f8f] transition hover:bg-[#eeeeee] hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60"
          @click="mobileSidebarOpen ? closeAllOverlays() : openMobileSidebar()"
        >
          <X v-if="mobileSidebarOpen" class="h-4 w-4" />
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M4 9h16M4 15h10"
            />
          </svg>
        </button>
        <div class="flex min-w-0 items-center gap-2">
          <img :src="appLogo" alt="App logo" class="h-6 w-6 rounded object-contain" />
          <div class="truncate text-sm font-semibold text-zinc-900">BrokerDraft</div>
        </div>
      </header>

      <div class="min-h-0 flex-1">
        <slot />
      </div>
    </main>
  </div>
</template>

