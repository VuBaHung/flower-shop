import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import LoginForm from '@/components/LoginForm'

export const metadata = { title: 'Đăng nhập — Quản trị' }

export default async function LoginPage() {
  // Already signed in: skip the form.
  if (await isAuthenticated()) redirect('/products')

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-xl font-black text-stone-900">
          Quản trị cửa hàng
        </h1>
        <p className="mt-1 text-sm text-stone-500">Đăng nhập để quản lý sản phẩm.</p>
        <LoginForm />
      </div>
    </main>
  )
}
