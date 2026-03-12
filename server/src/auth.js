import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'brokerdraft-dev-secret'
const APP_ROLE_USER = 'user'
const APP_ROLE_SUPER_ADMIN = 'super_admin'

function normalizeRole(role) {
  const value = String(role ?? '').trim().toLowerCase()
  if (value === APP_ROLE_SUPER_ADMIN) return APP_ROLE_SUPER_ADMIN
  return APP_ROLE_USER
}

export function mapUserForClient(dbUser) {
  return {
    userId: dbUser.user_id,
    fullName: dbUser.full_name ?? dbUser.login_name ?? 'User',
    loginName: dbUser.login_name ?? '',
    email: dbUser.email ?? '',
    mobileNumber: dbUser.mobile_number ?? '',
    profilePhoto: dbUser['profile photo'] ?? '',
    role: normalizeRole(dbUser.role),
  }
}

export function signAuthToken(dbUser) {
  const payload = {
    sub: dbUser.user_id,
    role: normalizeRole(dbUser.role),
    loginName: dbUser.login_name ?? '',
    type: 'auth',
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

export function signPasswordChangeToken(dbUser) {
  const payload = {
    sub: dbUser.user_id,
    role: normalizeRole(dbUser.role),
    loginName: dbUser.login_name ?? '',
    type: 'password_change',
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function getBearerToken(req) {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice('Bearer '.length).trim() || null
}

export function ensureAllowedRole(role) {
  return normalizeRole(role)
}

