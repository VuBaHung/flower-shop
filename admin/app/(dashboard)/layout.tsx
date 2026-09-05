import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'
import PublishButton from '@/components/PublishButton'
import PublishSection from '@/components/PublishSection'
import LogoutButton from '@/components/LogoutButton'

/**
 * The auth gate for every dashboard page. PLAN.md §3A.5: this guards the UI, and each
 * write API route re-checks independently — a hidden UI is not access control.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAuthenticated())) redirect('/login')

  const nav = [
    { href: '/products', label: 'Sản phẩm' },
    { href: '/campaigns', label: 'Khuyến mãi' },
    { href: '/occasions', label: 'Dịp' },
    { href: '/settings', label: 'Cài đặt' },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="font-display text-sm font-black">Quản trị</span>
          <div className="flex items-center gap-2">
            <PublishButton />
            <LogoutButton />
          </div>
        </div>

        {/* Scrolls horizontally rather than wrapping — this is used one-handed on a phone. */}
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      <PublishSection />
    </div>
  )
}
