<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, KeyRound, Lock, Sparkles, UserRound } from 'lucide-vue-next'
import appLogo from '../assets/app-logo.png'
import { apiRequest } from '../lib/api'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { setSession } = useAuth()

const loginName = ref('')
const password = ref('')
const remember = ref(true)
const showPassword = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const phase = ref('login')
const passwordConfirm = ref('')
const tempToken = ref('')
const pendingUser = ref(null)

const canSubmitLogin = computed(() => loginName.value.trim() && password.value)
const canSubmitPasswordChange = computed(
  () => password.value && passwordConfirm.value && password.value === passwordConfirm.value,
)

async function onLogin() {
  if (!canSubmitLogin.value || submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        loginName: loginName.value.trim(),
        password: password.value,
      }),
    })

    if (res.requirePasswordChange) {
      phase.value = 'change-password'
      tempToken.value = res.tempToken
      pendingUser.value = res.user
      password.value = ''
      passwordConfirm.value = ''
      showPassword.value = false
      return
    }

    setSession(res.token, res.user)
    await router.replace('/')
  } catch (err) {
    errorMessage.value = err?.message ?? 'Unable to sign in.'
  } finally {
    submitting.value = false
  }
}

async function onChangePassword() {
  if (!canSubmitPasswordChange.value || submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const res = await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        tempToken: tempToken.value,
        password: password.value,
        passwordConfirm: passwordConfirm.value,
      }),
    })
    setSession(res.token, res.user)
    await router.replace('/')
  } catch (err) {
    errorMessage.value = err?.message ?? 'Unable to change password.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-20 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-zinc-900/10 blur-3xl" />
      <div class="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-zinc-900/10 blur-3xl" />
      <div class="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-zinc-900/10 blur-3xl" />
    </div>

    <div class="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div class="grid w-full items-center gap-10 lg:grid-cols-2">
        <section class="hidden lg:block">
          <div class="animate-enter space-y-6">
            <div class="inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <img :src="appLogo" alt="BrokerDraft logo" class="h-10 w-10 rounded-xl object-contain" />
              <div class="min-w-0">
                <div class="text-base font-semibold text-zinc-900">BrokerDraft</div>
                <div class="text-sm text-zinc-500">Smart Property Docs</div>
              </div>
            </div>

            <div class="space-y-3">
              <h1 class="text-3xl font-semibold tracking-tight text-zinc-900">
                Welcome back
              </h1>
              <p class="max-w-md text-base leading-relaxed text-zinc-600">
                Sign in to manage property documents with clarity, speed, and a premium SaaS experience.
              </p>
            </div>

            <div class="grid max-w-md gap-3">
              <div class="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Sparkles class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-zinc-900">Modern workflow</div>
                  <div class="text-sm text-zinc-600">Fast, minimal, and built for daily use</div>
                </div>
              </div>
              <div class="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Lock class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-zinc-900">Secure by default</div>
                  <div class="text-sm text-zinc-600">Clean auth UX with safe defaults</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="flex justify-center lg:justify-end">
          <div class="w-full max-w-md animate-enter">
            <div class="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-xl shadow-zinc-900/10 backdrop-blur">
              <div class="mb-6 space-y-2">
                <div class="flex items-center gap-3 lg:hidden">
                  <img :src="appLogo" alt="BrokerDraft logo" class="h-10 w-10 rounded-xl object-contain" />
                  <div class="min-w-0">
                    <div class="text-base font-semibold text-zinc-900">BrokerDraft</div>
                    <div class="text-sm text-zinc-500">Smart Property Docs</div>
                  </div>
                </div>
                <h2 class="text-xl font-semibold text-zinc-900">
                  {{ phase === 'login' ? 'Sign in' : 'Change password' }}
                </h2>
                <p class="text-sm text-zinc-600">
                  {{
                    phase === 'login'
                      ? 'Use your credentials to continue.'
                      : 'First-time sign in detected. Set a secure password to continue.'
                  }}
                </p>
              </div>

              <form v-if="phase === 'login'" class="space-y-4" @submit.prevent="onLogin">
                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-zinc-700">Login name</span>
                  <div class="group relative">
                    <UserRound class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-zinc-700" />
                    <input
                      v-model="loginName"
                      type="text"
                      autocomplete="username"
                      placeholder="Enter login name"
                      class="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    />
                  </div>
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-zinc-700">Password</span>
                  <div class="group relative">
                    <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-zinc-700" />
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="••••••••"
                      class="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-10 pr-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      @click="showPassword = !showPassword"
                    >
                      <EyeOff v-if="showPassword" class="h-4 w-4" />
                      <Eye v-else class="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <div class="flex items-center justify-between">
                  <label class="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                    <input
                      v-model="remember"
                      type="checkbox"
                      class="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300"
                    />
                    Remember me
                  </label>
                  <a href="#" class="text-sm font-medium text-zinc-700 transition hover:text-zinc-900">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  :disabled="!canSubmitLogin || submitting"
                  class="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span v-if="submitting" class="inline-flex items-center gap-2">
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                  <span v-else>Continue</span>
                </button>

                <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {{ errorMessage }}
                </div>

                <div class="pt-2 text-center text-sm text-zinc-600">
                  Don’t have an account?
                  <a href="#" class="font-medium text-zinc-800 transition hover:text-zinc-950">Request access</a>
                </div>
              </form>

              <form v-else class="space-y-4" @submit.prevent="onChangePassword">
                <div class="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  Logged in as <span class="font-semibold">{{ pendingUser?.loginName }}</span>
                </div>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-zinc-700">New password</span>
                  <div class="group relative">
                    <KeyRound class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-zinc-700" />
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Enter new password"
                      class="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-10 pr-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      @click="showPassword = !showPassword"
                    >
                      <EyeOff v-if="showPassword" class="h-4 w-4" />
                      <Eye v-else class="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-sm font-medium text-zinc-700">Confirm password</span>
                  <div class="group relative">
                    <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-zinc-700" />
                    <input
                      v-model="passwordConfirm"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Confirm new password"
                      class="h-11 w-full rounded-2xl border border-zinc-300 bg-white px-10 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  :disabled="!canSubmitPasswordChange || submitting"
                  class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span v-if="submitting" class="inline-flex items-center gap-2">
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Updating password…
                  </span>
                  <span v-else>Update password</span>
                </button>

                <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {{ errorMessage }}
                </div>
              </form>
            </div>

            <p class="mt-4 text-center text-xs text-zinc-500">
              By continuing you agree to our Terms and acknowledge our Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

