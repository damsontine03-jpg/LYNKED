import './env.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseDir = path.resolve(__dirname, '../../database')

const DATABASE_URL = process.env.DATABASE_URL?.trim()
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add your Neon connection string to backend/.env')
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
})

const schema = fs.readFileSync(path.join(databaseDir, 'schema.pg.sql'), 'utf8')
await pool.query(schema)

const { rows: tables } = await pool.query(`
  SELECT c.relname AS name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY c.relname
`)

const counts = []
for (const table of tables) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM ${quoteIdent(table.name)}`,
  )
  counts.push({ table: table.name, rows: rows[0].n })
}

console.log(`Migrated ${counts.length} tables to Neon Postgres`)
for (const row of counts) {
  console.log(`  ${row.table} (${row.rows} rows)`)
}

await pool.end()

function quoteIdent(name) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
    throw new Error(`Unexpected table name: ${name}`)
  }
  return `"${name}"`
}
