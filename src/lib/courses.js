/**
 * Course helpers shared by the public site and the admin panel.
 *
 * A course has:
 *   category / subcategory   – where it sits in the catalogue (names are resolved live from slugs)
 *   venues[]                 – city names (from the Venues table) the course runs in
 *   deliveryModes[]          – 'In-Person' | 'Virtual' | 'In-House'
 *   thumbnail                – public image URL (uploaded in Admin → Courses)
 */

export const DELIVERY_MODES = ['In-Person', 'Virtual', 'In-House']

export const MODE_META = {
  'In-Person': { icon: '🏫', hint: 'Classroom training at the venue you choose' },
  'Virtual':   { icon: '💻', hint: 'Live online sessions (Zoom / Teams)' },
  'In-House':  { icon: '🏢', hint: 'Delivered at your own premises' },
}

/** 'In-Person / Virtual' → ['In-Person','Virtual'] */
export function parseModes(format = '') {
  const f = String(format || '').toLowerCase()
  return DELIVERY_MODES.filter(m => f.includes(m.toLowerCase()))
}

/** Modes a visitor can pick for this course (never empty) */
export function getCourseModes(course) {
  const fromArray = Array.isArray(course?.deliveryModes) ? course.deliveryModes.filter(m => DELIVERY_MODES.includes(m)) : []
  if (fromArray.length) return DELIVERY_MODES.filter(m => fromArray.includes(m))
  const fromFormat = parseModes(course?.format)
  return fromFormat.length ? fromFormat : ['In-Person']
}

/** 'In-Person', 'Virtual' → 'In-Person / Virtual' (kept in courses.format for old filters/search) */
export const modesToFormat = (modes = []) => DELIVERY_MODES.filter(m => modes.includes(m)).join(' / ')

/**
 * Venues a visitor can pick for a course: the venues the admin ticked, matched to live
 * (active) venue rows. Older rows without `venues` fall back to cities found in `location`.
 * If nothing is set the course is offered in every active venue.
 */
export function getCourseVenues(course, allVenues = []) {
  const active = (allVenues || []).filter(v => v && v.active !== false)
  const names = Array.isArray(course?.venues) ? course.venues : []
  let picked = names.length
    ? active.filter(v => names.some(n => String(n).toLowerCase() === String(v.name).toLowerCase()))
    : []
  if (!picked.length && course?.location) {
    const loc = String(course.location).toLowerCase()
    picked = active.filter(v => loc.includes(String(v.name).toLowerCase()))
  }
  return picked.length ? picked : active
}

/** Does the course run in this city? (used by venue filters) */
export const courseRunsIn = (course, venueName, allVenues) =>
  getCourseVenues(course, allVenues).some(v => String(v.name).toLowerCase() === String(venueName).toLowerCase())

export const slugify = (s = '') =>
  String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const shortText = (course, max = 140) => {
  const t = course?.shortDescription || course?.description || ''
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '…' : t
}

/** Map a DB row (snake_case) → app course (camelCase) */
export function courseFromRow(c) {
  if (!c) return c
  return {
    ...c,
    categorySlug: c.category_slug ?? c.categorySlug,
    subcategory: c.subcategory ?? '',
    subcategorySlug: c.subcategory_slug ?? c.subcategorySlug ?? '',
    nextDate: c.next_date ?? c.nextDate,
    shortDescription: c.short_description ?? c.shortDescription ?? '',
    targetAudience: c.target_audience ?? c.targetAudience ?? '',
    deliveryModes: c.delivery_modes ?? c.deliveryModes ?? parseModes(c.format),
    venues: c.venues ?? [],
    thumbnail: c.thumbnail || '',
    outcomes: c.outcomes || [],
  }
}

/** Map app course → exact DB columns (whitelist; no stray keys reach PostgREST) */
export function courseToRow(c) {
  const modes = getCourseModes(c)
  const venues = Array.isArray(c.venues) ? c.venues : []
  return {
    title: c.title,
    slug: c.slug,
    category: c.category || null,
    category_slug: c.categorySlug || null,
    subcategory: c.subcategory || null,
    subcategory_slug: c.subcategorySlug || null,
    duration: c.duration,
    format: modesToFormat(modes),
    delivery_modes: modes,
    level: c.level,
    price: Number(c.price) || 0,
    featured: !!c.featured,
    published: c.published !== false,
    short_description: c.shortDescription || null,
    description: c.description || null,
    target_audience: c.targetAudience || null,
    outcomes: c.outcomes || [],
    thumbnail: c.thumbnail || null,
    venues,
    location: venues.join(', ') || c.location || null,
    next_date: c.nextDate || null,
  }
}

export const categoryToRow = (c) => ({
  name: c.name, slug: c.slug, icon: c.icon || '📚', description: c.description || null,
  course_count: Number(c.courseCount ?? c.course_count) || 0,
  color: c.color || 'navy', published: c.published !== false, sort_order: Number(c.sort_order) || 0,
})

export const subcategoryToRow = (s) => ({
  category_id: s.category_id, name: s.name, slug: s.slug, description: s.description || null,
  sort_order: Number(s.sort_order) || 0, published: s.published !== false,
})

export const venueToRow = (v) => ({
  name: v.name, country: v.country || null, region: v.region || null, type: v.type || null,
  description: v.description || null, image: v.image || null,
  sort_order: Number(v.sort_order) || 0, active: v.active !== false,
})

/** Link to a course page, carrying the visitor's current venue / training-type filter */
export function courseLink(course, { venue, type } = {}) {
  const q = new URLSearchParams()
  if (venue) q.set('venue', venue)
  if (type) q.set('type', type)
  const qs = q.toString()
  return `/course/${course.slug}${qs ? `?${qs}` : ''}`
}

/** One filter used by every course listing (search, level, training type, venue) */
export function matchesFilters(course, { q = '', level = '', type = '', venue = '' } = {}, allVenues = []) {
  const needle = q.trim().toLowerCase()
  if (needle) {
    const hay = [course.title, course.category, course.subcategory, course.description, course.shortDescription, course.location, ...(course.venues || [])]
      .filter(Boolean).join(' ').toLowerCase()
    if (!hay.includes(needle)) return false
  }
  if (level && course.level !== level) return false
  if (type && !getCourseModes(course).includes(type)) return false
  if (venue) {
    // Virtual / in-house courses are not tied to a city, so a venue filter only narrows in-person courses
    if (!getCourseModes(course).includes('In-Person')) return false
    if (!courseRunsIn(course, venue, allVenues)) return false
  }
  return true
}
