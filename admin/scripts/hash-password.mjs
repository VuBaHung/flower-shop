#!/usr/bin/env node
/**
 * Generates ADMIN_PASSWORD_HASH and SESSION_SECRET for .env — PLAN.md §3A.5 stores the
 * password as a bcrypt hash, never plaintext.
 *
 *   npm run hash-password -- 'your-password-here'
 */
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const password = process.argv[2]

if (!password) {
  console.error("Usage: npm run hash-password -- 'your-password-here'")
  process.exit(1)
}
if (password.length < 12) {
  console.error(`Password is ${password.length} characters. Use at least 12.`)
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
const secret = randomBytes(32).toString('hex')

/*
 * Every bcrypt hash contains '$' ($2b$12$...) and dotenv performs VARIABLE EXPANSION on
 * the value — quoted or not. Unescaped, "$2b$12$AZrh..." silently collapses from 60
 * characters to ~33, and the login then fails in a way that looks like a wrong password
 * rather than a corrupted value. Verified: only backslash-escaping survives.
 *
 * So emit the escaped form ready to paste. lib/auth.ts also repairs an unescaped hash at
 * runtime, because a value pasted from elsewhere will not have been through this script.
 */
const escaped = hash.replaceAll('$', '\\$')

console.log('\nPaste these into admin/.env exactly as shown — never commit them:\n')
console.log(`ADMIN_PASSWORD_HASH=${escaped}`)
console.log(`SESSION_SECRET=${secret}\n`)
console.log('The backslashes are required: dotenv treats $ as a variable reference and')
console.log('would otherwise corrupt the hash.\n')
