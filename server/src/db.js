import mysql from 'mysql2/promise'

function getDbConfig() {
  const host = process.env.DB_HOST
  const database = process.env.DB_NAME
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD

  if (!host || !database || !user || !password) {
    return {
      ok: false,
      error:
        'Database is not configured. Fill in DB_HOST, DB_NAME, DB_USER, DB_PASSWORD in the root .env file.',
    }
  }

  return { ok: true, host, database, user, password }
}

const cfg = getDbConfig()

export const dbConfigError = cfg.ok ? null : cfg.error
export const dbPool = cfg.ok
  ? mysql.createPool({
      host: cfg.host,
      database: cfg.database,
      user: cfg.user,
      password: cfg.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  : null

