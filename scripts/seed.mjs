#!/usr/bin/env node
/**
 * Seeds MongoDB from data/fixtures.json — the Phase 3.5 step that gets the twelve
 * fixture products into a real database so the admin has something to edit.
 *
 * Safe to re-run: upserts by code/slug rather than inserting duplicates. It never
 * deletes, so it cannot destroy work the admin has already done.
 */
import { MongoClient } from 'mongodb'
import { readFile } from 'node:fs/promises'

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!uri || !dbName) {
  console.error('Set MONGODB_URI and MONGODB_DB first (see .env.example).')
  process.exit(1)
}

const fixtures = JSON.parse(await readFile(new URL('../data/fixtures.json', import.meta.url)))
const client = new MongoClient(uri)

try {
  await client.connect()
  const db = client.db(dbName)

  await db.collection('products').createIndex({ code: 1 }, { unique: true })
  await db.collection('occasions').createIndex({ slug: 1 }, { unique: true })
  await db.collection('campaigns').createIndex({ slug: 1 }, { unique: true })

  for (const p of fixtures.products ?? []) {
    await db.collection('products').updateOne({ code: p.code }, { $set: p }, { upsert: true })
  }
  for (const o of fixtures.occasions ?? []) {
    await db.collection('occasions').updateOne({ slug: o.slug }, { $set: o }, { upsert: true })
  }
  for (const c of fixtures.campaigns ?? []) {
    await db.collection('campaigns').updateOne({ slug: c.slug }, { $set: c }, { upsert: true })
  }
  if (fixtures.settings) {
    await db.collection('settings').updateOne(
      { _id: 'site' },
      { $set: fixtures.settings },
      { upsert: true }
    )
  }

  console.log(
    `Seeded: ${fixtures.products?.length ?? 0} products, ` +
      `${fixtures.occasions?.length ?? 0} occasions, ` +
      `${fixtures.campaigns?.length ?? 0} campaigns.`
  )
} finally {
  await client.close()
}
