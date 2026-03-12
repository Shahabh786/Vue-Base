import express from 'express'
import cors from 'cors'
import './env.js'
import { dbConfigError, dbPool } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

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

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

