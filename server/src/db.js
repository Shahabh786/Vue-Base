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
const createUsersTableSql =
  'CREATE TABLE IF NOT EXISTS `users` (' +
  '`user_id` int AUTO_INCREMENT primary key,' +
  '`full_name` varchar(150) DEFAULT NULL,' +
  '`login_name` varchar(150) DEFAULT NULL,' +
  '`email` varchar(150) DEFAULT NULL,' +
  '`mobile_number` varchar(10) DEFAULT NULL,' +
  '`password` varchar(45) DEFAULT NULL,' +
  '`password_hash` varchar(255) DEFAULT NULL,' +
  '`password_salt` varchar(255) DEFAULT NULL,' +
  '`role` varchar(45) DEFAULT NULL,' +
  '`profile photo` varchar(500) DEFAULT NULL,' +
  '`created_by` int DEFAULT NULL,' +
  '`created_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,' +
  '`modified_by` int DEFAULT NULL,' +
  '`modified_on` timestamp NULL DEFAULT NULL' +
  ')'

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

export async function ensureUsersTableExists() {
  if (!dbPool) return false
  await dbPool.query(createUsersTableSql)
  return true
}

