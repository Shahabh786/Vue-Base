import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import fs from 'node:fs/promises'
import path from 'node:path'
import './env.js'
import { dbConfigError, dbPool, ensureUsersTableExists } from './db.js'
import {
  ensureAllowedRole,
  getBearerToken,
  mapUserForClient,
  signAuthToken,
  signPasswordChangeToken,
  verifyToken,
} from './auth.js'

const app = express()
app.use(cors())
app.use(express.json())
const uploadsDir = path.resolve(process.cwd(), 'uploads')
app.use('/uploads', express.static(uploadsDir))

function normalizeLoginName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
}

function isValidLoginName(value) {
  return /^[a-z0-9._]{3,30}$/.test(value)
}

function toClientProfilePhoto(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/')) return raw
  return `/${raw}`
}

async function getAuthContext(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ ok: false, error: 'Missing authorization token.' })
    return null
  }
  try {
    const payload = verifyToken(token)
    if (payload.type !== 'auth') {
      res.status(401).json({ ok: false, error: 'Invalid token type.' })
      return null
    }
    const userId = Number(payload.sub)
    if (!userId) {
      res.status(401).json({ ok: false, error: 'Invalid token.' })
      return null
    }
    return { userId, payload }
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired token.' })
    return null
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'server',
    ts: new Date().toISOString(),
    dbConfigured: !dbConfigError,
  })
})

app.get('/api/db/ping', async (req, res) => {
  if (!dbPool) {
    res.status(500).json({ ok: false, error: dbConfigError })
    return
  }
  try {
    const [rows] = await dbPool.query('SELECT 1 AS ok')
    res.json({ ok: true, rows })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
})

app.post('/api/auth/login', async (req, res) => {
  if (!dbPool) {
    res.status(500).json({ ok: false, error: dbConfigError })
    return
  }

  const loginName = normalizeLoginName(req.body?.loginName)
  const password = String(req.body?.password ?? '')
  if (!loginName || !password) {
    res.status(400).json({ ok: false, error: 'loginName and password are required.' })
    return
  }

  try {
    const [rows] = await dbPool.query(
      'SELECT * FROM `users` WHERE `login_name` = ? LIMIT 1',
      [loginName],
    )
    const user = rows[0]
    if (!user) {
      res.status(401).json({ ok: false, error: 'Invalid credentials.' })
      return
    }

    user.role = ensureAllowedRole(user.role)
    const hasPlainPassword = user.password != null && String(user.password).length > 0
    const hasHashedPassword =
      user.password_hash != null &&
      String(user.password_hash).length > 0 &&
      user.password_salt != null &&
      String(user.password_salt).length > 0

    if (hasPlainPassword) {
      if (password !== user.password) {
        res.status(401).json({ ok: false, error: 'Invalid credentials.' })
        return
      }
      user['profile photo'] = toClientProfilePhoto(user['profile photo'])

      const tempToken = signPasswordChangeToken(user)
      res.json({
        ok: true,
        requirePasswordChange: true,
        tempToken,
        user: mapUserForClient(user),
      })
      return
    }

    if (!hasHashedPassword) {
      res.status(500).json({
        ok: false,
        error: 'User password is not initialized. Contact administrator.',
      })
      return
    }

    const computedHash = await bcrypt.hash(password, user.password_salt)
    if (computedHash !== user.password_hash) {
      res.status(401).json({ ok: false, error: 'Invalid credentials.' })
      return
    }

    const token = signAuthToken(user)
    user['profile photo'] = toClientProfilePhoto(user['profile photo'])
    res.json({ ok: true, requirePasswordChange: false, token, user: mapUserForClient(user) })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
})

app.post('/api/auth/change-password', async (req, res) => {
  if (!dbPool) {
    res.status(500).json({ ok: false, error: dbConfigError })
    return
  }

  const tempToken = String(req.body?.tempToken ?? '')
  const password = String(req.body?.password ?? '')
  const passwordConfirm = String(req.body?.passwordConfirm ?? '')

  if (!tempToken || !password || !passwordConfirm) {
    res.status(400).json({
      ok: false,
      error: 'tempToken, password and passwordConfirm are required.',
    })
    return
  }
  if (password !== passwordConfirm) {
    res.status(400).json({ ok: false, error: 'Password confirmation does not match.' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long.' })
    return
  }

  let payload
  try {
    payload = verifyToken(tempToken)
  } catch {
    res.status(401).json({ ok: false, error: 'Password change token is invalid or expired.' })
    return
  }

  if (payload.type !== 'password_change') {
    res.status(401).json({ ok: false, error: 'Invalid password change token.' })
    return
  }
  const userId = Number(payload.sub)
  if (!userId) {
    res.status(401).json({ ok: false, error: 'Invalid password change token.' })
    return
  }

  try {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    await dbPool.query(
      'UPDATE `users` SET `password` = NULL, `password_hash` = ?, `password_salt` = ?, `modified_by` = ?, `modified_on` = CURRENT_TIMESTAMP WHERE `user_id` = ?',
      [hash, salt, userId, userId],
    )

    const [rows] = await dbPool.query('SELECT * FROM `users` WHERE `user_id` = ? LIMIT 1', [
      userId,
    ])
    const user = rows[0]
    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found.' })
      return
    }
    user.role = ensureAllowedRole(user.role)
    user['profile photo'] = toClientProfilePhoto(user['profile photo'])

    const token = signAuthToken(user)
    res.json({ ok: true, token, user: mapUserForClient(user) })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
})

app.get('/api/users/check-login-name', async (req, res) => {
  if (!dbPool) {
    res.status(500).json({ ok: false, error: dbConfigError })
    return
  }
  const auth = await getAuthContext(req, res)
  if (!auth) return

  const loginName = normalizeLoginName(req.query?.loginName)
  if (!loginName) {
    res.status(400).json({ ok: false, error: 'loginName is required.' })
    return
  }
  if (!isValidLoginName(loginName)) {
    res.status(400).json({
      ok: false,
      error:
        'Login name must be 3-30 chars and contain only lowercase letters, numbers, dot, and underscore.',
    })
    return
  }

  try {
    const [rows] = await dbPool.query(
      'SELECT `user_id` FROM `users` WHERE `login_name` = ? AND `user_id` <> ? LIMIT 1',
      [loginName, auth.userId],
    )
    res.json({ ok: true, available: rows.length === 0 })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
})

app.post('/api/users/me/profile', async (req, res) => {
  if (!dbPool) {
    res.status(500).json({ ok: false, error: dbConfigError })
    return
  }
  const auth = await getAuthContext(req, res)
  if (!auth) return

  const fullName = String(req.body?.fullName ?? '').trim()
  const loginName = normalizeLoginName(req.body?.loginName)
  const email = String(req.body?.email ?? '').trim()
  const mobileNumber = String(req.body?.mobileNumber ?? '').trim()
  const profilePhotoDataUrl = String(req.body?.profilePhotoDataUrl ?? '')
  const clearProfilePhoto = Boolean(req.body?.clearProfilePhoto)

  if (!fullName || !loginName) {
    res.status(400).json({ ok: false, error: 'fullName and loginName are required.' })
    return
  }
  if (!isValidLoginName(loginName)) {
    res.status(400).json({
      ok: false,
      error:
        'Login name must be 3-30 chars and contain only lowercase letters, numbers, dot, and underscore.',
    })
    return
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: 'Invalid email format.' })
    return
  }
  if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
    res.status(400).json({ ok: false, error: 'Mobile number must be 10 digits.' })
    return
  }

  try {
    const [conflicts] = await dbPool.query(
      'SELECT `user_id` FROM `users` WHERE `login_name` = ? AND `user_id` <> ? LIMIT 1',
      [loginName, auth.userId],
    )
    if (conflicts.length > 0) {
      res.status(409).json({ ok: false, error: 'Username is already taken.' })
      return
    }

    let profilePhotoPath = null
    if (profilePhotoDataUrl && clearProfilePhoto) {
      res.status(400).json({
        ok: false,
        error: 'Cannot upload and clear profile photo in the same request.',
      })
      return
    }
    if (profilePhotoDataUrl) {
      const match = profilePhotoDataUrl.match(
        /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/,
      )
      if (!match) {
        res.status(400).json({ ok: false, error: 'Invalid profile image format.' })
        return
      }
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
      const buffer = Buffer.from(match[2], 'base64')
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ ok: false, error: 'Profile image must be less than 5MB.' })
        return
      }

      const profilesDir = path.join(uploadsDir, 'profiles')
      await fs.mkdir(profilesDir, { recursive: true })
      const fileName = `profile-${auth.userId}-${Date.now()}.${ext}`
      const diskPath = path.join(profilesDir, fileName)
      await fs.writeFile(diskPath, buffer)
      profilePhotoPath = `/uploads/profiles/${fileName}`
    }

    const setClauses = [
      '`full_name` = ?',
      '`login_name` = ?',
      '`email` = ?',
      '`mobile_number` = ?',
      '`modified_by` = ?',
      '`modified_on` = CURRENT_TIMESTAMP',
    ]
    const values = [fullName, loginName, email || null, mobileNumber || null, auth.userId]

    if (profilePhotoPath) {
      setClauses.push('`profile photo` = ?')
      values.push(profilePhotoPath)
    } else if (clearProfilePhoto) {
      setClauses.push('`profile photo` = NULL')
    }

    values.push(auth.userId)
    await dbPool.query(
      `UPDATE \`users\` SET ${setClauses.join(', ')} WHERE \`user_id\` = ?`,
      values,
    )

    const [rows] = await dbPool.query('SELECT * FROM `users` WHERE `user_id` = ? LIMIT 1', [
      auth.userId,
    ])
    const user = rows[0]
    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found.' })
      return
    }
    user.role = ensureAllowedRole(user.role)
    user['profile photo'] = toClientProfilePhoto(user['profile photo'])

    res.json({ ok: true, user: mapUserForClient(user) })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
})

app.get('/api/auth/me', async (req, res) => {
  if (!dbPool) {
    res.status(500).json({ ok: false, error: dbConfigError })
    return
  }

  const auth = await getAuthContext(req, res)
  if (!auth) return

  try {
    const [rows] = await dbPool.query('SELECT * FROM `users` WHERE `user_id` = ? LIMIT 1', [
      auth.userId,
    ])
    const user = rows[0]
    if (!user) {
      res.status(404).json({ ok: false, error: 'User not found.' })
      return
    }
    user.role = ensureAllowedRole(user.role)
    user['profile photo'] = toClientProfilePhoto(user['profile photo'])
    res.json({ ok: true, user: mapUserForClient(user) })
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? String(err) })
  }
})

const port = Number(process.env.PORT ?? 3001)

async function startServer() {
  if (dbPool) {
    try {
      await ensureUsersTableExists()
      console.log('Users table verified on startup.')
    } catch (err) {
      console.error('Failed to verify users table:', err?.message ?? String(err))
    }
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
  })
}

startServer()

