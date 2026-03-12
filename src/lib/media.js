const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export function resolveUserAvatarUrl(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

