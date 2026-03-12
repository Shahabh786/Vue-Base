import { computed, ref } from 'vue'

const STORAGE_KEY = 'brokerdraft.auth'
const token = ref('')
const user = ref(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    token.value = parsed?.token ?? ''
    user.value = parsed?.user ?? null
  } catch {
    token.value = ''
    user.value = null
  }
}

function persistAuth() {
  if (!token.value || !user.value) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: token.value,
      user: user.value,
    }),
  )
}

if (typeof window !== 'undefined') readStoredAuth()

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(token.value))
  const role = computed(() => user.value?.role ?? 'user')
  const isSuperAdmin = computed(() => role.value === 'super_admin')

  function setSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    persistAuth()
  }

  function clearSession() {
    token.value = ''
    user.value = null
    persistAuth()
  }

  function updateUser(nextUser) {
    if (!nextUser) return
    if (!user.value) user.value = nextUser
    else user.value = { ...user.value, ...nextUser }
    persistAuth()
  }

  return {
    token,
    user,
    role,
    isAuthenticated,
    isSuperAdmin,
    setSession,
    clearSession,
    updateUser,
  }
}

