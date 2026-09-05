import { MongoClient, type Db, type Collection, type Document } from 'mongodb'

/**
 * Admin-side Mongo access. Unlike the storefront's build-time reader, this one WRITES.
 *
 * Shares lib/types.ts with the storefront (via the @shared alias) so the two can never
 * drift — that shared contract is what PLAN.md §11 says makes the data source swappable.
 */

const globalForMongo = globalThis as unknown as { _adminMongo?: Promise<MongoClient> }

function uri(): string {
  const value = process.env.MONGODB_URI?.trim()
  if (!value) {
    throw new Error('Missing MONGODB_URI. See PLAN.md §3A.7 and fill in .env.')
  }
  return value
}

function dbName(): string {
  const value = process.env.MONGODB_DB?.trim()
  if (!value) {
    throw new Error('Missing MONGODB_DB. See PLAN.md §3A.7 and fill in .env.')
  }
  return value
}

export async function db(): Promise<Db> {
  if (!globalForMongo._adminMongo) {
    globalForMongo._adminMongo = new MongoClient(uri()).connect()
  }
  return (await globalForMongo._adminMongo).db(dbName())
}

export async function collection<T extends Document = Document>(
  name: 'products' | 'occasions' | 'campaigns' | 'settings'
): Promise<Collection<T>> {
  return (await db()).collection<T>(name)
}

/**
 * `code` is the public URL and the string customers quote in Zalo (PLAN.md §4), so it must
 * be unique. Enforced in the database as well as the form — the form can be bypassed.
 */
export async function ensureIndexes(): Promise<void> {
  const database = await db()
  await database.collection('products').createIndex({ code: 1 }, { unique: true })
  await database.collection('products').createIndex({ status: 1 })
  await database.collection('occasions').createIndex({ slug: 1 }, { unique: true })
  await database.collection('campaigns').createIndex({ slug: 1 }, { unique: true })
}
