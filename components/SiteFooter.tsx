import { Clock, Flower2, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { formatPhone, telHref, zaloHref } from '@/lib/format'

export default function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer id="lien-he" className="mt-auto bg-stone-900 pb-24 pt-14 text-stone-300 lg:pb-12">
      <div className="mx-auto max-w-container space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-stone-800 pb-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <Flower2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-black tracking-tight text-white">
                {settings.shopName}
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-stone-400">
              {settings.aboutText}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-sm font-bold text-white">Liên hệ đặt hoa</h2>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <a
                  href={telHref(settings.phone)}
                  className="flex items-center gap-2 hover:text-brand-300"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  {formatPhone(settings.phone)}
                </a>
              </li>
              <li>
                <a
                  href={zaloHref(settings.zaloPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-brand-300"
                >
                  <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  Tư vấn qua Zalo
                </a>
              </li>
              {settings.messengerUrl && (
                <li>
                  <a
                    href={settings.messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-brand-300"
                  >
                    <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    Messenger
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-sm font-bold text-white">Cửa hàng</h2>
            <ul className="space-y-2.5 text-xs leading-relaxed text-stone-400">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                {settings.address}
              </li>
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                {settings.hours}
              </li>
            </ul>
            <p className="text-2xs leading-relaxed text-stone-500">
              {settings.deliveryFeeNote}
              <br />
              {settings.sameDayCutoff}
            </p>
          </div>
        </div>

        <p className="text-2xs text-stone-500">
          © 2026 {settings.shopName}. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  )
}
