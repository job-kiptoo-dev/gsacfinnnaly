// src/context/SiteContext.jsx
// GSAC Site Context — Supabase-backed with local fallback

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { api } from '../api/index'
import { supabase } from '../lib/supabase'
import { DEFAULT_VENUES, normalizeVenue } from '../lib/venues'
import { courseFromRow, courseToRow, categoryToRow, subcategoryToRow, venueToRow } from '../lib/courses'

const SiteContext = createContext(null)

const defaultContent = {
  site: {
    name: 'Global Skills Advancement Center',
    tagline: 'SKILL EXCELLENCE IS BUSINESS ESSENTIAL',
    heroHeadline: 'ACCELERATE CAPABILITY. DELIVER MEASURABLE IMPACT. TRANSFORM YOUR ORGANIZATION FOR THE NEW ECONOMY.',
    heroSubtext: 'GSAC builds future-ready teams through hands-on learning, high-impact application, and coaching that turns new skills into measurable performance. Practical, local, and global content for immediate results.',
    phone: '+254721911847',
    email: 'partner@gsac.org',
    address: 'Bazaar Plaza, Moi Avenue, Nairobi, Kenya',
    hours: '8:00 AM - 5:00 PM EAT',
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    whatsapp: '+254726954964',
  },
  stats: {
    professionals: '15,000+', hours: '50,000+', satisfaction: '98%',
    venues: '26', countries: '15', courses: '1,500+', trainers: '200+', years: '9',
  },
  partners: [
    { id: '1', name: 'African Union', logo: 'https://gsac.org/storage/logos/338715.png' },
    { id: '2', name: 'FCCPC', logo: 'https://gsac.org/storage/logos/787413.png' },
    { id: '3', name: 'PCCB', logo: 'https://gsac.org/storage/logos/852236.png' },
    { id: '4', name: 'Konza Technopolis', logo: 'https://gsac.org/storage/logos/628427.png' },
    { id: '5', name: 'Defense Space Administration', logo: 'https://gsac.org/storage/logos/768921.webp' },
    { id: '6', name: 'Water Mission Tanzania', logo: 'https://gsac.org/storage/logos/169328.png' },
    { id: '7', name: 'Kenya Wildlife Service', logo: 'https://gsac.org/storage/logos/650606.webp' },
  ],
  testimonials: [
    { id: '1', quote: "Zero fluff. Pure execution. They didn't just train our team — they upgraded how we think, communicate, and deliver. You feel the impact immediately.", name: 'Linda Obiero', role: 'HR Lead', rating: 5, approved: true },
    { id: '2', quote: "This is elite-level facilitation. The trainers are sharp, structured, and relentless about outcomes. Our managers left with tools — not notes.", name: 'Ezra Wakaba', role: 'Business Manager', rating: 5, approved: true },
    { id: '3', quote: "We got ROI — fast. The training translated into measurable improvements. If you want performance, this is where you invest.", name: 'Abdallah Mohammed', role: 'Operations Lead', rating: 5, approved: true },
    { id: '4', quote: "Exceptionally well-structured program. The facilitators brought real-world experience that made every concept immediately applicable.", name: 'Amina Hassan', role: 'Program Manager', rating: 5, approved: true },
    { id: '5', quote: "GSAC transformed our leadership team. The ripple effect on our organization's performance has been remarkable and measurable.", name: 'David Kariuki', role: 'CEO, Tech Corp', rating: 5, approved: true },
  ],
}

const defaultCategories = [
  { id: '1', name: 'Leadership & Management', slug: 'leadership-management', icon: '🎯', description: 'Develop exceptional leadership skills and strategic management capabilities', courseCount: 85, color: 'blue' },
  { id: '2', name: 'Finance & Human Resources', slug: 'finance-hr', icon: '💼', description: 'Build core operational capability across people and financial systems', courseCount: 120, color: 'gold' },
  { id: '3', name: 'Monitoring & Evaluation', slug: 'monitoring-evaluation', icon: '📊', description: 'Master M&E methodologies for data-driven decision making', courseCount: 65, color: 'green' },
  { id: '4', name: 'Technology, Innovation & Data', slug: 'technology-innovation', icon: '💻', description: 'Modernize workflows with practical tech, analytics, and AI-ready capability', courseCount: 95, color: 'purple' },
  { id: '5', name: 'Procurement & Supply Chain', slug: 'procurement-supply-chain', icon: '🔗', description: 'Increase transparency, reduce leakage, and deliver reliable value for money', courseCount: 75, color: 'teal' },
  { id: '6', name: 'Project Management', slug: 'project-management', icon: '📋', description: 'Lead projects with precision from initiation through successful closure', courseCount: 90, color: 'red' },
  { id: '7', name: 'Risk, Compliance & Quality', slug: 'risk-compliance', icon: '🛡️', description: 'Build resilient systems that protect value and keep operations audit-ready', courseCount: 55, color: 'orange' },
  { id: '8', name: 'Digital Transformation', slug: 'digital-transformation', icon: '🚀', description: 'Navigate digital disruption and lead transformation initiatives', courseCount: 70, color: 'indigo' },
  { id: '9', name: 'Health & Public Sector', slug: 'health-public-sector', icon: '🏥', description: 'Specialized training for healthcare and public service professionals', courseCount: 60, color: 'pink' },
  { id: '10', name: 'Geospatial & Remote Sensing', slug: 'geospatial', icon: '🌍', description: 'Advanced geospatial technologies and remote sensing applications', courseCount: 40, color: 'cyan' },
]

const defaultCourses = [
  { id: '1', title: 'Training on Advanced Monitoring & Evaluation Techniques', slug: 'advanced-monitoring-evaluation', category: 'Monitoring & Evaluation', categorySlug: 'monitoring-evaluation', duration: '5 Days', format: 'In-Person / Virtual', level: 'Advanced', price: 1500, featured: true, published: true, description: 'The Advanced Monitoring & Evaluation Techniques course is designed for professionals looking to deepen their understanding of M&E practices, methodologies, and applications.', outcomes: ['Master advanced M&E frameworks', 'Develop robust evaluation designs', 'Apply mixed-methods approaches', 'Build organizational M&E systems'], location: 'Nairobi, Dubai, London', nextDate: '2025-02-10' },
  { id: '2', title: 'Training on Global Leadership', slug: 'global-leadership', category: 'Leadership & Management', categorySlug: 'leadership-management', duration: '5 Days', format: 'In-Person / Virtual', level: 'Intermediate', price: 1800, featured: true, published: true, description: "Develop the strategic leadership skills needed to lead organizations in today's complex global environment.", outcomes: ['Strategic thinking frameworks', 'Cross-cultural leadership', 'Change management mastery', 'Executive communication'], location: 'Nairobi, Kigali, Dubai', nextDate: '2025-02-17' },
  { id: '3', title: 'Training on Project Management Professional', slug: 'project-management-professional', category: 'Project Management', categorySlug: 'project-management', duration: '5 Days', format: 'In-Person', level: 'Intermediate', price: 1650, featured: true, published: true, description: 'Comprehensive project management training aligned with PMI standards and best practices.', outcomes: ['PMP examination preparation', 'Agile & waterfall methodologies', 'Risk management techniques', 'Stakeholder engagement'], location: 'Nairobi, Kampala, Cape Town', nextDate: '2025-02-24' },
  { id: '4', title: 'Training on Financial Management & Reporting', slug: 'financial-management-reporting', category: 'Finance & Human Resources', categorySlug: 'finance-hr', duration: '5 Days', format: 'In-Person / Virtual', level: 'Intermediate', price: 1550, featured: false, published: true, description: 'Master financial management principles and reporting standards for organizational excellence.', outcomes: ['Financial analysis techniques', 'Budget planning & control', 'Financial reporting standards', 'Cash flow management'], location: 'Nairobi, Dar es Salaam', nextDate: '2025-03-03' },
  { id: '5', title: 'Training on AI and Machine Learning for Business', slug: 'ai-machine-learning-business', category: 'Technology, Innovation & Data', categorySlug: 'technology-innovation', duration: '5 Days', format: 'Virtual / In-Person', level: 'Intermediate', price: 2000, featured: true, published: true, description: 'Practical AI and machine learning applications for business transformation and competitive advantage.', outcomes: ['AI strategy development', 'Machine learning fundamentals', 'Data-driven decision making', 'AI implementation roadmap'], location: 'Nairobi, Dubai, Virtual', nextDate: '2025-03-10' },
  { id: '6', title: 'Training on Supply Chain & Procurement Management', slug: 'supply-chain-procurement', category: 'Procurement & Supply Chain', categorySlug: 'procurement-supply-chain', duration: '5 Days', format: 'In-Person', level: 'Intermediate', price: 1500, featured: false, published: true, description: 'Build expertise in supply chain optimization and procurement best practices for operational efficiency.', outcomes: ['Strategic sourcing techniques', 'Supplier relationship management', 'Contract management', 'Supply chain risk mitigation'], location: 'Nairobi, Mombasa', nextDate: '2025-03-17' },
]

const defaultFAQs = [
  { id: '1', category: 'About GSAC', question: 'What is Global Skills Advancement Center?', answer: 'GSAC is a premier capacity-building and EdTech institution delivering high-impact professional training across Africa and beyond. We offer 1,500+ courses across all major business functions.' },
  { id: '2', category: 'About GSAC', question: 'How can I contact GSAC?', answer: 'Phone/WhatsApp: +254721911847 | Email: partner@gsac.org | Hours: 8:00 AM - 5:00 PM EAT (24/7 for urgent inquiries).' },
  { id: '3', category: 'Registration & Payment', question: 'How do I register for a course?', answer: 'Register online, email partner@gsac.org, or call +254721911847. Our team will guide you through enrollment.' },
  { id: '4', category: 'Registration & Payment', question: 'What is the refund policy?', answer: '14+ days before: full refund. 7-13 days: 50% refund. Under 7 days: no refund, but date transfer is available.' },
  { id: '5', category: 'Certification & Support', question: 'Is a certificate issued upon completion?', answer: 'Yes — an internationally recognized GSAC Certificate of Completion. CPD points awarded where applicable.' },
  { id: '6', category: 'Online & In-House Training', question: 'Do you offer virtual training?', answer: 'Yes. Live, interactive virtual training via Zoom/Teams with the same certificate as in-person programs.' },
]

const defaultBlogPosts = [
  { id: '1', title: 'The Future of Corporate Training in Africa', slug: 'future-corporate-training-africa', excerpt: 'How EdTech and AI are reshaping professional development across the continent.', content: "Africa's professional training landscape is undergoing a seismic shift...", author: 'GSAC Team', date: '2025-01-15', category: 'Industry Insights', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', published: true },
  { id: '2', title: 'Why Monitoring & Evaluation Skills Are Critical in 2025', slug: 'monitoring-evaluation-skills-2025', excerpt: "Organizations that invest in M&E capabilities significantly outperform those that don't.", content: 'In an era defined by accountability...', author: 'GSAC Team', date: '2025-01-08', category: 'Training Tips', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', published: true },
  { id: '3', title: '10 Leadership Traits That Define High-Impact Performers', slug: 'leadership-traits-high-impact-performers', excerpt: "What separates good leaders from truly transformational ones in today's landscape.", content: 'Leadership in the 21st century demands more...', author: 'GSAC Team', date: '2024-12-20', category: 'Leadership', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', published: true },
]


/* ── Demo-mode extras (only used when Supabase is not configured) ─────────── */
const DEMO_SUBS = [
  ['1','Strategic Leadership','strategic-leadership'],['1','Management Skills','management-skills'],['1','Change & Team Management','change-team-management'],
  ['2','Financial Management & Accounting','financial-management-accounting'],['2','Human Resource Management','human-resource-management'],['2','Payroll, Tax & Compensation','payroll-tax-compensation'],
  ['3','M&E Fundamentals','me-fundamentals'],['3','Advanced M&E & Impact Evaluation','advanced-me-impact-evaluation'],['3','Data Collection & Analysis','data-collection-analysis'],
  ['4','AI & Machine Learning','ai-machine-learning'],['4','Data Analytics & Business Intelligence','data-analytics-bi'],['4','Cybersecurity & Data Protection','cybersecurity-data-protection'],
  ['5','Procurement & Contracting','procurement-contracting'],['5','Supply Chain Strategy','supply-chain-strategy'],['5','Logistics & Warehousing','logistics-warehousing'],
  ['6','Project Planning & Control','project-planning-control'],['6','Agile & Scrum','agile-scrum'],['6','PMP & Certification Prep','pmp-certification-prep'],
  ['7','Risk Management','risk-management'],['7','Governance & Compliance','governance-compliance'],
  ['8','Digital Strategy','digital-strategy'],['8','Process Automation','process-automation'],
  ['9','Public Health Management','public-health-management'],['9','Health Informatics','health-informatics'],
  ['10','GIS & Mapping','gis-mapping'],['10','Remote Sensing','remote-sensing'],
].map(([category_id, name, slug], i) => ({ id: `demo-sub-${i + 1}`, category_id, name, slug, description: '', sort_order: i, published: true }))

const DEMO_EXTRA = {
  '1': { subcategory: 'Advanced M&E & Impact Evaluation', subcategorySlug: 'advanced-me-impact-evaluation', venues: ['Nairobi', 'Dubai', 'London'], deliveryModes: ['In-Person', 'Virtual'] },
  '2': { subcategory: 'Strategic Leadership', subcategorySlug: 'strategic-leadership', venues: ['Nairobi', 'Kigali', 'Dubai'], deliveryModes: ['In-Person', 'Virtual'] },
  '3': { subcategory: 'PMP & Certification Prep', subcategorySlug: 'pmp-certification-prep', venues: ['Nairobi', 'Kampala', 'Cape Town'], deliveryModes: ['In-Person'] },
  '4': { subcategory: 'Financial Management & Accounting', subcategorySlug: 'financial-management-accounting', venues: ['Nairobi', 'Dar es Salaam'], deliveryModes: ['In-Person', 'Virtual'] },
  '5': { subcategory: 'AI & Machine Learning', subcategorySlug: 'ai-machine-learning', venues: ['Nairobi', 'Dubai'], deliveryModes: ['In-Person', 'Virtual'] },
  '6': { subcategory: 'Supply Chain Strategy', subcategorySlug: 'supply-chain-strategy', venues: ['Nairobi', 'Mombasa'], deliveryModes: ['In-Person'] },
}
const DEMO_COURSES = defaultCourses.map(c => ({ ...c, ...DEMO_EXTRA[c.id], thumbnail: '', shortDescription: '', targetAudience: '' }))

function normalizeCategory(c) {
  if (!c) return c
  return { ...c, courseCount: c.course_count ?? c.courseCount ?? 0 }
}

/** Turn a Supabase/PostgREST error into something an admin can act on */
function friendly(error) {
  if (!error) return null
  const msg = error.message || String(error)
  if (error.code === '23505' || /duplicate key/i.test(msg)) return { message: 'That slug (URL key) or name is already in use. Please choose a different one.' }
  if (error.code === '42501' || /row-level security|permission denied/i.test(msg)) return { message: 'Permission denied. Make sure you are signed in and your profile role is "admin" (see README → Create your admin user).' }
  if (error.code === 'PGRST204' || /schema cache|column .* does not exist|Could not find the/i.test(msg)) return { message: `The database is missing a column (${msg}). Run supabase/migrations/003_subcategories_thumbnails_venues.sql in the Supabase SQL Editor, then reload.` }
  if (error.code === '42P01' || /relation .* does not exist/i.test(msg)) return { message: 'A database table is missing. Run supabase/migrations/003_subcategories_thumbnails_venues.sql in the Supabase SQL Editor.' }
  return { message: msg }
}

const stripMeta = ({ id, created_at, updated_at, ...rest }) => rest // eslint-disable-line no-unused-vars

export function SiteProvider({ children }) {
  const useSupabase = !!supabase
  const [content, setContent] = useState(defaultContent)
  // RAW lists. When an admin is signed in (RLS) these include drafts / hidden rows;
  // for visitors they only contain what is published. Public views are derived below.
  const [rawCategories, setRawCategories] = useState(defaultCategories)
  const [rawSubcategories, setRawSubcategories] = useState(DEMO_SUBS)
  const [rawCourses, setRawCourses] = useState(DEMO_COURSES)
  const [rawVenues, setRawVenues] = useState(DEFAULT_VENUES)
  const [rawFaqs, setRawFaqs] = useState(defaultFAQs)
  const [rawBlog, setRawBlog] = useState(defaultBlogPosts)
  const [rawTestimonials, setRawTestimonials] = useState(defaultContent.testimonials)
  const [rawPartners, setRawPartners] = useState(defaultContent.partners)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(useSupabase)
  const [syncError, setSyncError] = useState('')
  const mountedRef = useRef(true)
  const lastLoadRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  /** Pull everything from Supabase. Safe to call repeatedly (login, logout, tab focus, manual refresh). */
  const loadCatalog = useCallback(async ({ silent = false } = {}) => {
    if (!useSupabase) return
    if (!silent) setLoading(true)
    try {
      const [siteData, partnersRes, testimonialsRes, categoriesRes, subsRes, coursesRes, venuesRes, faqsRes, blogRes] = await Promise.all([
        api.siteContent.get(),
        api.partners.listAll(),
        api.testimonials.listAll(),
        api.categories.listAll(),
        api.subcategories.listAll(),
        api.courses.listAll(),
        api.venues.listAll(),
        api.faqs.listAll(),
        api.blog.listAll(),
      ])
      if (!mountedRef.current) return
      lastLoadRef.current = Date.now()

      const errors = [partnersRes, testimonialsRes, categoriesRes, subsRes, coursesRes, venuesRes, faqsRes, blogRes]
        .filter(r => r.error).map(r => r.error.message)
      setSyncError(errors.length ? errors[0] : '')
      if (errors.length) console.warn('[GSAC] Some data could not be loaded:', errors)

      setContent(prev => ({
        ...prev,
        site: siteData.site?.site_name ? {
          name: siteData.site.site_name, tagline: siteData.site.tagline,
          heroHeadline: siteData.site.hero_headline, heroSubtext: siteData.site.hero_subtext,
          phone: siteData.site.phone, email: siteData.site.email, address: siteData.site.address,
          hours: siteData.site.hours, facebook: siteData.site.facebook, twitter: siteData.site.twitter,
          linkedin: siteData.site.linkedin, instagram: siteData.site.instagram,
          youtube: siteData.site.youtube, whatsapp: siteData.site.whatsapp,
        } : prev.site,
        stats: siteData.stats?.professionals ? siteData.stats : prev.stats,
      }))
      // Use the database as the source of truth whenever the request succeeded — even when it is empty,
      // so deleting everything in Admin really empties the site (no phantom demo data).
      if (!partnersRes.error && partnersRes.data) setRawPartners(partnersRes.data)
      if (!testimonialsRes.error && testimonialsRes.data) setRawTestimonials(testimonialsRes.data)
      if (!categoriesRes.error && categoriesRes.data) setRawCategories(categoriesRes.data)
      if (!subsRes.error && subsRes.data) setRawSubcategories(subsRes.data)
      else if (subsRes.error) setRawSubcategories([])   // migration 003 not run yet → no subcategories, site still works
      if (!coursesRes.error && coursesRes.data) setRawCourses(coursesRes.data)
      if (!venuesRes.error && venuesRes.data) setRawVenues(venuesRes.data.map(normalizeVenue))
      if (!faqsRes.error && faqsRes.data) setRawFaqs(faqsRes.data)
      if (!blogRes.error && blogRes.data) setRawBlog(blogRes.data)
    } catch (err) {
      console.error('[GSAC] Bootstrap error:', err)
      setSyncError(err.message || 'Could not load data')
    } finally {
      if (mountedRef.current && !silent) setLoading(false)
    }
  }, [useSupabase])

  useEffect(() => {
    if (!useSupabase) return
    let subscription = null

    async function bootstrap() {
      await loadCatalog()
      try {
        const currentUser = await api.auth.getUser()
        if (mountedRef.current && currentUser) {
          setUser(currentUser)
          if (currentUser.role === 'admin') loadCatalog({ silent: true })  // pick up drafts/hidden rows
        }
      } catch { /* no session */ }
    }
    bootstrap()

    const { data: { subscription: sub } } = api.auth.onAuthChange(async (event, session) => {
      if (!mountedRef.current) return
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const profile = await api.auth.getUser()
          if (mountedRef.current) setUser(profile)
        } catch { if (mountedRef.current) setUser(session.user) }
        loadCatalog({ silent: true })
      } else if (event === 'SIGNED_OUT') {
        if (mountedRef.current) setUser(null)
        loadCatalog({ silent: true })
      }
    })
    subscription = sub

    // Keep long-open tabs fresh: when the visitor comes back to the tab, re-sync (at most once a minute)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoadRef.current > 60000) loadCatalog({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      subscription?.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [useSupabase, loadCatalog])

  /* ── Derived, always-in-sync views ─────────────────────────────────────── */
  const allCategories = useMemo(() => rawCategories.map(normalizeCategory), [rawCategories])
  const categories = useMemo(() => allCategories.filter(c => c.published !== false), [allCategories])

  const allSubcategories = useMemo(() => {
    const byId = Object.fromEntries(allCategories.map(c => [c.id, c]))
    return rawSubcategories
      .map(s => ({ ...s, categorySlug: byId[s.category_id]?.slug || '', categoryName: byId[s.category_id]?.name || '' }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.name).localeCompare(String(b.name)))
  }, [rawSubcategories, allCategories])
  const subcategories = useMemo(() => {
    const live = new Set(categories.map(c => c.slug))
    return allSubcategories.filter(s => s.published !== false && live.has(s.categorySlug))
  }, [allSubcategories, categories])

  // Resolve category / subcategory NAMES live from their slugs, so renaming one in Admin updates every course.
  const allCourses = useMemo(() => {
    const cat = Object.fromEntries(allCategories.map(c => [c.slug, c]))
    const sub = Object.fromEntries(allSubcategories.map(s => [`${s.categorySlug}/${s.slug}`, s]))
    return rawCourses.map(courseFromRow).map(c => ({
      ...c,
      category: cat[c.categorySlug]?.name ?? c.category,
      subcategory: sub[`${c.categorySlug}/${c.subcategorySlug}`]?.name ?? c.subcategory ?? '',
    }))
  }, [rawCourses, allCategories, allSubcategories])
  const courses = useMemo(() => allCourses.filter(c => c.published !== false), [allCourses])

  const allVenues = rawVenues
  const venues = useMemo(() => rawVenues.filter(v => v.active !== false), [rawVenues])
  const allFaqs = rawFaqs
  const faqs = useMemo(() => rawFaqs.filter(f => f.active !== false), [rawFaqs])
  const allBlogPosts = rawBlog
  const blogPosts = useMemo(() => rawBlog.filter(p => p.published !== false), [rawBlog])
  const allTestimonials = rawTestimonials
  const allPartners = rawPartners
  const publicContent = useMemo(() => ({
    ...content,
    testimonials: rawTestimonials.filter(t => t.approved !== false),
    partners: rawPartners.filter(p => p.active !== false),
  }), [content, rawTestimonials, rawPartners])

  /* ── Site content / stats ──────────────────────────────────────────────── */
  const updateContent = useCallback(async (section, data) => {
    setContent(prev => ({ ...prev, [section]: { ...prev[section], ...data } }))
    if (useSupabase && section === 'site') {
      const { error } = await api.siteContent.updateSite({
        site_name: data.name, tagline: data.tagline, hero_headline: data.heroHeadline,
        hero_subtext: data.heroSubtext, phone: data.phone, email: data.email,
        address: data.address, hours: data.hours, facebook: data.facebook,
        twitter: data.twitter, linkedin: data.linkedin, instagram: data.instagram,
        youtube: data.youtube, whatsapp: data.whatsapp,
      })
      return { error: friendly(error) }
    }
    return {}
  }, [useSupabase])

  const updateStat = useCallback(async (key, val) => {
    setContent(prev => ({ ...prev, stats: { ...prev.stats, [key]: val } }))
    if (useSupabase) return { error: friendly((await api.siteContent.updateStats({ [key]: val })).error) }
    return {}
  }, [useSupabase])

  const updateStats = useCallback(async (data) => {
    setContent(prev => ({ ...prev, stats: { ...prev.stats, ...data } }))
    if (useSupabase) return { error: friendly((await api.siteContent.updateStats(data)).error) }
    return {}
  }, [useSupabase])

  /* ── Generic list helpers (every mutation returns { data } or { error }) ── */
  const makeCrud = (setter, apiGroup, toRow = stripMeta, { prepend = false } = {}) => ({
    add: async (item) => {
      if (!useSupabase) {
        const row = { ...toRow(item), id: `local-${Date.now()}`, created_at: new Date().toISOString() }
        setter(prev => (prepend ? [row, ...prev] : [...prev, row])); return { data: row }
      }
      const { data, error } = await apiGroup.create(toRow(item))
      if (error) return { error: friendly(error) }
      setter(prev => (prepend ? [data, ...prev] : [...prev, data])); return { data }
    },
    update: async (id, item) => {
      if (!useSupabase) { setter(prev => prev.map(r => r.id === id ? { ...r, ...toRow(item) } : r)); return {} }
      const { data, error } = await apiGroup.update(id, toRow(item))
      if (error) return { error: friendly(error) }
      setter(prev => prev.map(r => r.id === id ? data : r)); return { data }
    },
    remove: async (id) => {
      if (useSupabase) {
        const { error } = await apiGroup.delete(id)
        if (error) return { error: friendly(error) }
      }
      setter(prev => prev.filter(r => r.id !== id)); return {}
    },
  })

  const faqCrud = makeCrud(setRawFaqs, api.faqs)
  const blogCrud = makeCrud(setRawBlog, api.blog, stripMeta, { prepend: true })
  const testimonialCrud = makeCrud(setRawTestimonials, api.testimonials)
  const partnerCrud = makeCrud(setRawPartners, api.partners)
  const venueCrud = makeCrud(setRawVenues, api.venues, venueToRow)
  const courseCrud = makeCrud(setRawCourses, api.courses, courseToRow, { prepend: true })
  const subCrud = makeCrud(setRawSubcategories, api.subcategories, subcategoryToRow)
  const catCrud = makeCrud(setRawCategories, api.categories, categoryToRow)

  /* ── Courses ───────────────────────────────────────────────────────────── */
  const addCourse = useCallback((c) => courseCrud.add(c), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateCourse = useCallback((id, c) => courseCrud.update(id, c), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteCourse = useCallback(async (id) => {
    const course = rawCourses.find(c => c.id === id)
    const res = await courseCrud.remove(id)
    if (!res.error && course?.thumbnail && useSupabase) api.storage.removeThumbnail(course.thumbnail) // tidy up the image file
    return res
  }, [useSupabase, rawCourses]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Categories (+ keep courses pointing at the right slug) ───────────── */
  const addCategory = useCallback((c) => catCrud.add(c), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateCategory = useCallback(async (id, data) => {
    const old = rawCategories.find(c => c.id === id)
    const res = await catCrud.update(id, data)
    if (!res.error && old && (old.slug !== data.slug || old.name !== data.name)) {
      if (useSupabase) await api.courses.renameCategorySlug(old.slug, data.slug, data.name)
      setRawCourses(prev => prev.map(c => (c.category_slug ?? c.categorySlug) === old.slug
        ? { ...c, category_slug: data.slug, categorySlug: data.slug, category: data.name } : c))
    }
    return res
  }, [useSupabase, rawCategories]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteCategory = useCallback(async (id) => {
    const cat = rawCategories.find(c => c.id === id)
    const used = rawCourses.filter(c => (c.category_slug ?? c.categorySlug) === cat?.slug).length
    if (used) return { error: { message: `This category still has ${used} course(s). Move or delete those courses first.` } }
    const res = await catCrud.remove(id)
    if (!res.error) setRawSubcategories(prev => prev.filter(s => s.category_id !== id))   // DB cascades too
    return res
  }, [useSupabase, rawCategories, rawCourses]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Subcategories ─────────────────────────────────────────────────────── */
  const addSubcategory = useCallback((s) => subCrud.add(s), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateSubcategory = useCallback(async (id, data) => {
    const old = rawSubcategories.find(s => s.id === id)
    const res = await subCrud.update(id, data)
    if (!res.error && old && (old.slug !== data.slug || old.name !== data.name)) {
      const catSlug = rawCategories.find(c => c.id === (data.category_id || old.category_id))?.slug
      if (useSupabase && catSlug) await api.courses.renameSubcategorySlug(catSlug, old.slug, data.slug, data.name)
      setRawCourses(prev => prev.map(c => ((c.category_slug ?? c.categorySlug) === catSlug && (c.subcategory_slug ?? c.subcategorySlug) === old.slug)
        ? { ...c, subcategory_slug: data.slug, subcategorySlug: data.slug, subcategory: data.name } : c))
    }
    return res
  }, [useSupabase, rawSubcategories, rawCategories]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteSubcategory = useCallback(async (id) => {
    const sub = allSubcategories.find(s => s.id === id)
    const used = allCourses.filter(c => c.categorySlug === sub?.categorySlug && c.subcategorySlug === sub?.slug).length
    if (used) return { error: { message: `This subcategory still has ${used} course(s). Move or delete those courses first.` } }
    return subCrud.remove(id)
  }, [useSupabase, allSubcategories, allCourses]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Venues, FAQs, blog, testimonials, partners ────────────────────────── */
  const addVenue = useCallback((v) => venueCrud.add(v), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateVenue = useCallback(async (id, data) => {
    const old = rawVenues.find(v => v.id === id)
    const res = await venueCrud.update(id, data)
    // Courses reference venues by city name — keep them in step if a city is renamed
    if (!res.error && old && data.name && old.name !== data.name) {
      const affected = rawCourses.filter(c => (c.venues || []).includes(old.name))
      for (const c of affected) {
        const venuesNew = c.venues.map(n => n === old.name ? data.name : n)
        if (useSupabase) await api.courses.update(c.id, { venues: venuesNew, location: venuesNew.join(', ') })
        setRawCourses(prev => prev.map(x => x.id === c.id ? { ...x, venues: venuesNew, location: venuesNew.join(', ') } : x))
      }
    }
    return res
  }, [useSupabase, rawVenues, rawCourses]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteVenue = useCallback((id) => venueCrud.remove(id), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps

  const addFaq = useCallback((f) => faqCrud.add(f), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateFaq = useCallback((id, f) => faqCrud.update(id, f), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteFaq = useCallback((id) => faqCrud.remove(id), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const addBlogPost = useCallback((p) => blogCrud.add(p), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateBlogPost = useCallback((id, p) => blogCrud.update(id, p), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteBlogPost = useCallback((id) => blogCrud.remove(id), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const addTestimonial = useCallback((t) => testimonialCrud.add(t), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updateTestimonial = useCallback((id, t) => testimonialCrud.update(id, t), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const deleteTestimonial = useCallback((id) => testimonialCrud.remove(id), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const addPartner = useCallback((p) => partnerCrud.add(p), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const updatePartner = useCallback((id, p) => partnerCrud.update(id, p), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps
  const deletePartner = useCallback((id) => partnerCrud.remove(id), [useSupabase]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auth ──────────────────────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    if (useSupabase) {
      const result = await api.auth.login(email, password)
      if (result.success && result.user) setUser(result.user)
      return result
    }
    const isAdmin = email === 'admin@gsac.org' && password === 'admin123'
    if (!isAdmin && email !== 'user@gsac.org') return { success: false, error: 'Invalid credentials.' }
    const u = { email, role: isAdmin ? 'admin' : 'user', name: email.split('@')[0] }
    setUser(u)
    return { success: true, user: u }
  }, [useSupabase])

  const register = useCallback(async (data) => {
    if (useSupabase) {
      const result = await api.auth.register(data)
      if (result.success && result.user && !result.needsConfirmation) setUser(result.user)
      return result
    }
    const u = { ...data, role: 'user' }
    setUser(u)
    return { success: true, needsConfirmation: false, user: u }
  }, [useSupabase])

  const logout = useCallback(async () => {
    if (useSupabase) await api.auth.logout()
    setUser(null)
  }, [useSupabase])

  return (
    <SiteContext.Provider value={{
      content: publicContent,
      // public (what visitors see)
      categories, subcategories, courses, venues, faqs, blogPosts,
      // everything incl. drafts / hidden rows (used by the admin panel)
      allCategories, allSubcategories, allCourses, allVenues, allFaqs, allBlogPosts, allTestimonials, allPartners,
      user, loading, useSupabase, syncError, refresh: () => loadCatalog({ silent: true }),
      updateContent, updateStat, updateStats,
      addCourse, updateCourse, deleteCourse,
      addCategory, updateCategory, deleteCategory,
      addSubcategory, updateSubcategory, deleteSubcategory,
      addVenue, updateVenue, deleteVenue,
      addFaq, updateFaq, deleteFaq,
      addBlogPost, updateBlogPost, deleteBlogPost,
      addTestimonial, updateTestimonial, deleteTestimonial,
      addPartner, updatePartner, deletePartner,
      login, register, logout,
    }}>
      {children}
    </SiteContext.Provider>
  )
}

export const useSite = () => {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite must be used inside SiteProvider')
  return ctx
}
