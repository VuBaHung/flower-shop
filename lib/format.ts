/** VND: 850000 -> "850.000₫" */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}₫`
}

/** "0901234567" -> "0901 234 567" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10
    ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
    : phone
}

/** tel: needs E.164 — "0901234567" -> "+84901234567" */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `tel:+84${digits.replace(/^0/, '')}`
}

/** A personal number only supports a zalo.me deep link (PLAN.md §7). */
export function zaloHref(zaloPhone: string): string {
  return `https://zalo.me/${zaloPhone.replace(/\D/g, '')}`
}

/** "2026-09-28" -> "28/9" */
export function formatDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${Number(day)}/${Number(month)}`
}
