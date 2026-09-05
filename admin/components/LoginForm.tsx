'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Đăng nhập thất bại.')
        setBusy(false)
        return
      }
      // refresh() so the server re-reads the new cookie before navigating.
      router.replace('/products')
      router.refresh()
    } catch {
      setError('Không kết nối được máy chủ.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <div>
        <label htmlFor="username" className="block text-xs font-bold text-stone-700">
          Tên đăng nhập
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold text-stone-700">
          Mật khẩu
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
      >
        {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Đăng nhập
      </button>
    </form>
  )
}
