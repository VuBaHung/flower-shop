'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Trash2 } from 'lucide-react'
import type { Occasion, Product } from '@shared/types'
import ImageUploader from './ImageUploader'
import ProductPreview from './ProductPreview'
import VideoUpload from './VideoUpload'

/**
 * PLAN.md §9 — this is used one-handed, on a phone, in a shop:
 *   - "Lưu nháp" saves with status=hidden and skips most validation, so a half-entered
 *     product is never lost
 *   - delete asks first, and the copy steers toward hiding instead
 *   - saving is not publishing; the header's Publish button is what goes live
 */

type FieldErrors = Record<string, string>

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-bold text-stone-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-2xs text-stone-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900'

export default function ProductForm({
  product,
  occasions,
  isNew,
}: {
  product: Product | null
  occasions: Occasion[]
  isNew: boolean
}) {
  const router = useRouter()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [video, setVideo] = useState<string>(product?.video ?? '')
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    product?.occasions ?? []
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  // On a phone the preview would push the whole form down, so it is opt-in there and
  // always visible from `lg` up.
  const [showPreview, setShowPreview] = useState(false)

  /**
   * Only the fields the preview shows are tracked live; the rest stay uncontrolled and
   * are read from FormData on submit. Keeping this list small avoids re-rendering the
   * whole form on every keystroke in a field nobody is previewing.
   */
  const [preview, setPreview] = useState({
    code: product?.code ?? '',
    name: product?.name ?? '',
    subtitle: product?.subtitle ?? '',
    shortDesc: product?.shortDesc ?? '',
    badge: product?.badge ?? '',
    badgeStyle: product?.badgeStyle ?? undefined,
    price: product?.price,
    priceNote: product?.priceNote ?? '',
    salePrice: product?.salePrice,
    saleNote: product?.saleNote ?? '',
  })

  /** Mirrors lib/products.ts: the admin types VND naturally ("850.000"). */
  function parseVnd(v: string): number | undefined {
    const cleaned = v.replace(/[.,\s]/g, '')
    if (cleaned === '') return undefined
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : undefined
  }

  function track<K extends keyof typeof preview>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const raw = e.target.value
      const value =
        key === 'price' || key === 'salePrice' ? parseVnd(raw) : raw
      setPreview((p) => ({ ...p, [key]: value }))
    }
  }

  async function save(e: React.FormEvent<HTMLFormElement>, status: 'active' | 'hidden') {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setBanner(null)

    const form = new FormData(e.currentTarget)
    const payload = {
      code: form.get('code'),
      name: form.get('name'),
      price: form.get('price'),
      priceNote: form.get('priceNote'),
      salePrice: form.get('salePrice'),
      saleNote: form.get('saleNote'),
      occasions: selectedOccasions,
      flowerType: form.get('flowerType'),
      subtitle: form.get('subtitle'),
      badge: form.get('badge'),
      badgeStyle: form.get('badgeStyle'),
      shortDesc: form.get('shortDesc'),
      size: form.get('size'),
      description: form.get('description'),
      images,
      video,
      status,
      featured: form.get('featured') === 'on',
      sort: form.get('sort'),
    }

    const url = isNew ? '/api/products' : `/api/products/${product!.code}`
    const method = isNew ? 'POST' : 'PUT'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 422 || res.status === 409) {
        const data = await res.json()
        setErrors(data.errors ?? {})
        setBanner('Vui lòng kiểm tra lại các ô được đánh dấu.')
        setBusy(false)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setBanner(data.error ?? 'Lưu thất bại.')
        setBusy(false)
        return
      }

      router.push('/products')
      router.refresh()
    } catch {
      setBanner('Không kết nối được máy chủ.')
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      const res = await fetch(`/api/products/${product!.code}`, { method: 'DELETE' })
      if (!res.ok) {
        setBanner('Xoá thất bại.')
        setBusy(false)
        return
      }
      router.push('/products')
      router.refresh()
    } catch {
      setBanner('Không kết nối được máy chủ.')
      setBusy(false)
    }
  }

  function toggleOccasion(slug: string) {
    setSelectedOccasions((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const previewNode = (
    <ProductPreview
      draft={{ ...preview, images, occasions: selectedOccasions }}
      occasionLabels={occasions
        .filter((o) => selectedOccasions.includes(o.slug))
        .map((o) => o.label)}
    />
  )

  return (
    <form
      onSubmit={(e) => save(e, 'active')}
      className="mt-4 flex flex-col gap-6 pb-28 lg:flex-row lg:items-start"
    >
      <div className="min-w-0 flex-1 space-y-5">
      {banner && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          {banner}
        </p>
      )}

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <Field
          label="Mã sản phẩm"
          htmlFor="code"
          error={errors.code}
          hint={
            isNew
              ? 'Ví dụ HB-001. Không sửa được sau khi tạo — đây là địa chỉ trang và mã khách nhắn Zalo.'
              : 'Không thể sửa mã: khách hàng đã có thể đang giữ đường dẫn này.'
          }
        >
          <input
            id="code"
            name="code"
            defaultValue={product?.code}
            onChange={track('code')}
            readOnly={!isNew}
            required
            className={`${inputClass} font-mono uppercase ${!isNew ? 'bg-stone-100 text-stone-500' : ''}`}
          />
        </Field>

        <Field label="Tên sản phẩm" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            defaultValue={product?.name}
            onChange={track('name')}
            className={inputClass}
          />
        </Field>

        <Field label="Dòng phụ" htmlFor="subtitle" hint="Ví dụ: Waxflower Úc Import">
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={product?.subtitle}
            onChange={track('subtitle')}
            className={inputClass}
          />
        </Field>

        <Field
          label="Mô tả ngắn"
          htmlFor="shortDesc"
          hint="1–2 dòng hiện trên thẻ sản phẩm."
        >
          <textarea
            id="shortDesc"
            name="shortDesc"
            rows={2}
            defaultValue={product?.shortDesc}
            onChange={track('shortDesc')}
            className={inputClass}
          />
        </Field>

        <Field
          label="Mô tả đầy đủ"
          htmlFor="description"
          hint="2–4 câu. Dùng cho mô tả trên Google."
        >
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">Giá</h2>

        <Field
          label="Giá (VND)"
          htmlFor="price"
          error={errors.price}
          hint='Để trống để hiện "Liên hệ".'
        >
          <input
            id="price"
            name="price"
            inputMode="numeric"
            defaultValue={product?.price}
            onChange={track('price')}
            className={inputClass}
          />
        </Field>

        <Field label="Ghi chú giá" htmlFor="priceNote" hint='Ví dụ "từ" → "từ 850.000₫"'>
          <input
            id="priceNote"
            name="priceNote"
            defaultValue={product?.priceNote}
            onChange={track('priceNote')}
            className={inputClass}
          />
        </Field>

        <Field
          label="Giá khuyến mãi (VND)"
          htmlFor="salePrice"
          error={errors.salePrice}
          hint="Chỉ áp dụng khi có chương trình khuyến mãi đang chạy."
        >
          <input
            id="salePrice"
            name="salePrice"
            inputMode="numeric"
            defaultValue={product?.salePrice}
            onChange={track('salePrice')}
            className={inputClass}
          />
        </Field>

        <Field label="Nhãn khuyến mãi" htmlFor="saleNote" hint='Ví dụ "Giá 20/10"'>
          <input
            id="saleNote"
            name="saleNote"
            defaultValue={product?.saleNote}
            onChange={track('saleNote')}
            className={inputClass}
          />
        </Field>
      </section>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">Ảnh</h2>
        <ImageUploader images={images} onChange={setImages} />
        {errors.images && (
          <p role="alert" className="text-2xs font-semibold text-rose-700">
            {errors.images}
          </p>
        )}

        <VideoUpload value={video} onChange={setVideo} />
      </section>

      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">
          Phân loại
        </h2>

        <fieldset>
          <legend className="text-xs font-bold text-stone-700">Dịp</legend>
          {occasions.length === 0 ? (
            <p className="mt-1 text-2xs text-amber-700">
              Chưa có dịp nào. Thêm ở mục “Dịp” trước.
            </p>
          ) : (
            // A multi-select, not free text — this is the failure mode the spreadsheet
            // had, where a typo silently hid a product from every filter.
            <div className="mt-2 flex flex-wrap gap-2">
              {occasions.map((o) => {
                const on = selectedOccasions.includes(o.slug)
                return (
                  <button
                    key={o.slug}
                    type="button"
                    onClick={() => toggleOccasion(o.slug)}
                    aria-pressed={on}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                      on
                        ? 'bg-stone-900 text-white'
                        : 'border border-stone-300 text-stone-600 hover:border-stone-500'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          )}
          {errors.occasions && (
            <p role="alert" className="mt-1 text-2xs font-semibold text-rose-700">
              {errors.occasions}
            </p>
          )}
        </fieldset>

        <Field label="Loại hoa" htmlFor="flowerType" hint="hồng, hướng dương, lan…">
          <input
            id="flowerType"
            name="flowerType"
            defaultValue={product?.flowerType}
            className={inputClass}
          />
        </Field>

        <Field label="Kích thước" htmlFor="size" hint="Nhỏ / Vừa / Lớn">
          <input id="size" name="size" defaultValue={product?.size} className={inputClass} />
        </Field>

        <Field label="Nhãn góc" htmlFor="badge" hint='Ví dụ "HOT TREND". Để trống nếu không cần.'>
          <input
            id="badge"
            name="badge"
            defaultValue={product?.badge}
            onChange={track('badge')}
            className={inputClass}
          />
        </Field>

        <Field label="Kiểu nhãn" htmlFor="badgeStyle" error={errors.badgeStyle}>
          {/* A fixed list, so the admin cannot invent a color the design system lacks. */}
          <select
            id="badgeStyle"
            name="badgeStyle"
            defaultValue={product?.badgeStyle ?? ''}
            onChange={track('badgeStyle')}
            className={inputClass}
          >
            <option value="">— không —</option>
            <option value="hot">hot (đỏ)</option>
            <option value="info">info (xanh)</option>
            <option value="luxe">luxe (vàng)</option>
          </select>
        </Field>

        <Field label="Thứ tự" htmlFor="sort" hint="Số nhỏ hiện trước.">
          <input
            id="sort"
            name="sort"
            inputMode="numeric"
            defaultValue={product?.sort ?? 999}
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-2 text-xs font-bold text-stone-700">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured}
            className="h-4 w-4 rounded border-stone-300"
          />
          Ghim lên trang chủ
        </label>
      </section>

      {!isNew && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-rose-700">
            Xoá sản phẩm
          </h2>
          <p className="mt-1 text-2xs text-rose-800">
            Nên dùng “Lưu nháp” để ẩn thay vì xoá — xoá sẽ làm hỏng đường dẫn mà khách đã
            được gửi qua Zalo.
          </p>
          {confirmDelete ? (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Xoá vĩnh viễn {product!.code}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-600"
              >
                Huỷ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Xoá
            </button>
          )}
        </section>
      )}

      </div>

      {/* Desktop: preview pinned beside the form. Mobile: toggled open below. */}
      <aside className="lg:w-[280px] lg:flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          aria-expanded={showPreview}
          className="mb-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700 lg:hidden"
        >
          {showPreview ? 'Ẩn xem trước' : 'Xem trước sản phẩm'}
        </button>
        <div className={showPreview ? 'block' : 'hidden lg:block'}>{previewNode}</div>
      </aside>

      {/* Pinned: on a long form on a phone, the save buttons must never be a scroll away. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              const form = e.currentTarget.closest('form')
              if (form) {
                save(
                  { preventDefault: () => {}, currentTarget: form } as unknown as React.FormEvent<HTMLFormElement>,
                  'hidden'
                )
              }
            }}
            className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
          >
            Lưu nháp
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Lưu &amp; hiện
          </button>
        </div>
        <p className="mx-auto mt-1.5 max-w-5xl text-center text-2xs text-stone-500">
          Lưu chưa đăng lên website — nhấn “Đăng lên website” ở trên khi xong.
        </p>
      </div>
    </form>
  )
}
