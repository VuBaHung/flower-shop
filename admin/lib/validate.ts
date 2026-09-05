import type { Product, Campaign, Occasion } from '@shared/types'

/**
 * Entry-time validation — one of the main reasons for replacing the spreadsheet
 * (PLAN.md §4). A bad `occasions` tag is rejected with a message instead of silently
 * producing a product that no filter chip can reach.
 *
 * Two modes, because PLAN.md §9 requires drafts to be saveable half-finished:
 *   - draft (status 'hidden'): only `code` must be valid, so nothing is ever lost
 *   - publish (status 'active'): everything a live page needs must be present
 */

export type FieldErrors = Record<string, string>

const CODE_PATTERN = /^[A-Z0-9]{2,10}-[A-Z0-9]{1,10}$/

export function validateProduct(
  input: Partial<Product>,
  knownOccasions: string[],
  mode: 'draft' | 'publish'
): FieldErrors {
  const errors: FieldErrors = {}

  const code = input.code?.trim() ?? ''
  if (!code) {
    errors.code = 'Bắt buộc nhập mã sản phẩm.'
  } else if (!CODE_PATTERN.test(code)) {
    errors.code = 'Mã phải dạng HB-001 (chữ in hoa, số, một dấu gạch ngang).'
  }

  // A draft is allowed to be incomplete — that is the point of it.
  if (mode === 'draft') return errors

  if (!input.name?.trim()) errors.name = 'Bắt buộc nhập tên sản phẩm.'

  const images = (input.images ?? []).filter((i) => i?.trim())
  if (images.length === 0) {
    errors.images = 'Cần ít nhất 1 ảnh — ảnh đầu tiên dùng cho Google và Zalo.'
  }

  const occasions = input.occasions ?? []
  if (occasions.length === 0) {
    errors.occasions = 'Chọn ít nhất 1 dịp, nếu không sản phẩm sẽ không hiện trong bộ lọc.'
  } else {
    const unknown = occasions.filter((o) => !knownOccasions.includes(o))
    if (unknown.length > 0) {
      errors.occasions = `Dịp không hợp lệ: ${unknown.join(', ')}.`
    }
  }

  if (input.price !== undefined && (!Number.isFinite(input.price) || input.price < 0)) {
    errors.price = 'Giá phải là số dương, hoặc để trống để hiện "Liên hệ".'
  }

  // Mirrors the storefront rule: a sale price with nothing to strike through renders wrong.
  if (input.salePrice !== undefined) {
    if (input.price === undefined) {
      errors.salePrice = 'Cần có giá gốc trước khi đặt giá khuyến mãi.'
    } else if (input.salePrice >= input.price) {
      errors.salePrice = 'Giá khuyến mãi phải thấp hơn giá gốc.'
    }
  }

  if (input.badgeStyle && !['hot', 'info', 'luxe'].includes(input.badgeStyle)) {
    errors.badgeStyle = 'Kiểu nhãn không hợp lệ.'
  }

  // PLAN.md §4.1: ratings must be real or absent. The form offers no way to invent them,
  // but a value arriving via the API is still checked.
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
    errors.rating = 'Đánh giá phải từ 1 đến 5.'
  }

  return errors
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function validateCampaign(input: Partial<Campaign>): FieldErrors {
  const errors: FieldErrors = {}

  const slug = input.slug?.trim() ?? ''
  if (!slug) {
    errors.slug = 'Bắt buộc nhập slug.'
  } else if (/\d{4}/.test(slug)) {
    // PLAN.md §6.2: campaign URLs are year-agnostic so the same page accrues SEO value
    // every year instead of starting over.
    errors.slug = 'Slug không được chứa năm (dùng "hoa-20-10", không phải "hoa-20-10-2026").'
  }

  if (!input.title?.trim()) errors.title = 'Bắt buộc nhập tiêu đề.'

  if (!input.startDate || !ISO_DATE.test(input.startDate)) {
    errors.startDate = 'Ngày bắt đầu phải dạng YYYY-MM-DD.'
  }
  if (!input.endDate || !ISO_DATE.test(input.endDate)) {
    errors.endDate = 'Ngày kết thúc phải dạng YYYY-MM-DD.'
  }
  if (
    input.startDate &&
    input.endDate &&
    ISO_DATE.test(input.startDate) &&
    ISO_DATE.test(input.endDate) &&
    input.startDate > input.endDate
  ) {
    errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.'
  }

  return errors
}

export function validateOccasion(input: Partial<Occasion>): FieldErrors {
  const errors: FieldErrors = {}
  const slug = input.slug?.trim() ?? ''
  if (!slug) {
    errors.slug = 'Bắt buộc nhập slug.'
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    // The slug becomes a ?dip= query value on the storefront.
    errors.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.'
  }
  if (!input.label?.trim()) errors.label = 'Bắt buộc nhập tên hiển thị.'
  return errors
}
