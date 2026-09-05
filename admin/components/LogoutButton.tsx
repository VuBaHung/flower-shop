'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Đăng xuất"
      className="rounded-lg border border-stone-300 p-2 text-stone-600 hover:bg-stone-100"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
