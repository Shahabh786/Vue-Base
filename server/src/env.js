import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

const rootEnvPath = path.resolve(process.cwd(), '../.env')
const localEnvPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(rootEnvPath)) dotenv.config({ path: rootEnvPath })
else dotenv.config({ path: localEnvPath })

export function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

