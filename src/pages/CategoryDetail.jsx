import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CourseCard from '../components/common/CourseCard'
import CourseFilters from '../components/common/CourseFilters'
import { useSite } from '../context/SiteContext'
import { categoryHero } from '../lib/categoryColors'
import { matchesFilters } from '../lib/courses'

export default function CategoryDetail() {
  const { slug, subslug } = useParams()
  const { categories, subcategories, courses, venues } = useSite()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [type, setType] = useState('')
  const [venue, setVenue] = useState('')

  const category = categories.find(c => c.slug === slug)
  const subs = useMemo(() => subcategories.filter(s => s.categorySlug === slug), [subcategories, slug])
  const activeSub = subs.find(s => s.slug === subslug)

  const categoryCourses = useMemo(() =>
    courses.filter(c => c.published && c.categorySlug === slug),
    [courses, slug]
  )
  const inScope = activeSub ? categoryCourses.filter(c => c.subcategorySlug === activeSub.slug) : categoryCourses
  const filtered = inScope.filter(c => matchesFilters(c, { q: search, level, type, venue }, venues))
  const countFor = (sub) => categoryCourses.filter(c => c.subcategorySlug === sub.slug).length

  if (!category) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Category Not Found</h2>
        <Link to="/training-categories" className="btn-primary">All Categories</Link>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className={`bg-gradient-to-br ${categoryHero(category.color)} py-16 px-6`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-4 flex-wrap">
            <Link to="/training-categories" className="hover:text-white">All Categories</Link>
            <span>/</span>
            {activeSub ? (
              <>
                <Link to={`/training-categories/${category.slug}`} className="hover:text-white">{category.name}</Link>
                <span>/</span>
                <span className="text-white">{activeSub.name}</span>
              </>
            ) : <span className="text-white">{category.name}</span>}
          </div>
          <div className="flex items-start gap-5">
            <div className="text-5xl flex-shrink-0">{category.icon}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{activeSub ? activeSub.name : category.name}</h1>
              <p className="text-white/80 text-sm max-w-2xl leading-relaxed mb-4">
                {activeSub ? (activeSub.description || category.description) : category.description}
              </p>
              <div className="flex flex-wrap gap-4 text-white/70 text-sm">
                <span>📚 {inScope.length} courses available</span>
                <span>💻 In-Person & Virtual</span>
                <span>🏅 Internationally Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {subs.length > 0 && (
        <div className="bg-white border-b py-4 px-6">
          <div className="max-w-7xl mx-auto flex gap-2 flex-wrap items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Subcategory</span>
            <Link to={`/training-categories/${category.slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!activeSub ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40'}`}>
              All ({categoryCourses.length})
            </Link>
            {subs.map(sc => (
              <Link key={sc.id} to={`/training-categories/${category.slug}/${sc.slug}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeSub?.id === sc.id ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy/40'}`}>
                {sc.name} ({countFor(sc)})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-b py-4 px-6 sticky top-[105px] z-30">
        <div className="max-w-7xl mx-auto flex gap-3 flex-wrap items-center">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…" className="input-field max-w-xs text-sm py-2 px-4" />
          <select value={level} onChange={e => setLevel(e.target.value)} className="input-field max-w-[140px] text-sm py-2" aria-label="Level">
            <option value="">All Levels</option>
            {['Beginner','Intermediate','Advanced'].map(l => <option key={l}>{l}</option>)}
          </select>
          <CourseFilters type={type} setType={setType} venue={venue} setVenue={setVenue} />
          <span className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} courses</span>
        </div>
      </div>

      {/* Courses */}
      <section className="py-14 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📚</div>
              <h3 className="text-xl font-bold mb-2">No courses match your filter</h3>
              <button onClick={() => { setSearch(''); setLevel(''); setType(''); setVenue('') }} className="btn-secondary mt-4">Clear filters</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(course => <CourseCard key={course.id} course={course} venue={venue} type={type} />)}
            </div>
          )}
        </div>
      </section>

      {/* Related Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="section-title-h2 mb-6">Other Training Categories</h2>
          <div className="flex flex-wrap gap-3">
            {categories.filter(c => c.slug !== slug).map(cat => (
              <Link key={cat.id} to={`/training-categories/${cat.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-gray-200 hover:border-teal-dark hover:bg-teal-50 text-sm font-medium text-gray-700 hover:text-teal-deep transition-all">
                <span>{cat.icon}</span> {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
