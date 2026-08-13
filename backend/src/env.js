import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const candidates = [path.join(dir, '../.env'), path.resolve('.env')]

for (const file of candidates) {
  try {
    process.loadEnvFile(file)
    break
  } catch {
    /* Render injects environment variables */
  }
}
