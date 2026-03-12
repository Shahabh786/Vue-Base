<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { user, role, isSuperAdmin, clearSession } = useAuth()

async function logout() {
  clearSession()
  await router.replace('/login')
}
</script>

<template>
  <div class="flex h-full items-center justify-center px-6 py-8">
    <div class="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <div class="text-xs font-medium uppercase tracking-wide text-zinc-500">Signed in</div>
          <div class="mt-1 text-xl font-semibold text-zinc-900">
            Welcome, {{ user?.fullName || 'User' }}
          </div>
          <div class="mt-1 text-sm text-zinc-600">
            Role:
            <span class="font-semibold text-zinc-800">{{ role }}</span>
          </div>
        </div>
        <button
          type="button"
          class="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          @click="logout"
        >
          Logout
        </button>
      </div>

      <div
        v-if="isSuperAdmin"
        class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        Super Admin view enabled. All features are currently visible.
      </div>
      <div
        v-else
        class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      >
        User role detected. Role-based restrictions will be applied here next.
      </div>

      <div class="mt-4 text-sm text-zinc-500">Coming Soon</div>
    </div>
  </div>
</template>

