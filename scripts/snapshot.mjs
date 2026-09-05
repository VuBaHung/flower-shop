#!/usr/bin/env node
/**
 * PLAN.md §3A.4 — MANDATORY BACKUP.
 *
 * The Google Sheet this replaced gave the owner free version history; MongoDB M0 has no
 * automated backup. Losing the database means re-entering every product from photographs.
 *
 * The daily cron build already reads the whole catalog, so this writes it to
 * data/snapshots/<date>.json and commits it. That gives Git-backed history at no cost,
 * and doubles as a fixtures file for local development.
 *
 * Restoring is a plain `mongoimport` of the arrays in the snapshot — test it before
 * launch, per the §12 acceptance criteria.
 */
import { MongoClient } from 'mongodb'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!uri || !dbName) {
  console.error('MONGODB_URI / MONGODB_DB not set — nothing to snapshot.')
  // Not an error: a fixtures-only build legitimately has no database yet.
  process.exit(0)
}

const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(dbName)

  const [products, occasions, campaigns, settings] = await Promise.all([
    db.collection('products').find({}).toArray(),
    db.collection('occasions').find({}).toArray(),
    db.collection('campaigns').find({}).toArray(),
    db.collection('settings').find({}).toArray(),
  ])

  // Refuse to overwrite a good snapshot with an empty one: if the read fails or the
  // database is wiped, the last known-good backup must survive.
  if (products.length === 0) {
    console.error('Snapshot aborted: zero products returned. Refusing to write an empty backup.')
    process.exit(1)
  }

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const dir = path.join(process.cwd(), 'data', 'snapshots')
  await mkdir(dir, { recursive: true })

  const file = path.join(dir, `${date}.json`)
  await writeFile(
    file,
    JSON.stringify(
      { takenAt: new Date().toISOString(), products, occasions, campaigns, settings },
      null,
      2
    )
  )

  console.log(
    `Snapshot written: data/snapshots/${date}.json ` +
      `(${products.length} products, ${campaigns.length} campaigns)`
  )
} finally {
  await client.close()
}
