import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CourseCard from '../components/common/CourseCard'
import CourseFilters from '../components/common/CourseFilters'
import { useSite } from '../context/SiteContext'
import { categoryTile } from '../lib/categoryColors'
import { matchesFilters } from '../lib/courses'

export default function TrainingCategories() {
  const { categories, subcategories, courses, venues } = useSite()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '')
  const [selectedSub, setSelectedSub] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [venue, setVenue] = useState(searchParams.get('venue') || '')

  const published = courses.filter(c => c.published)
  const subOptions = subcategories.filter(s => s.categorySlug === selectedCat)

  const filteredCourses = useMemo(() => published.filter(c =>
    matchesFilters(c, { q: search, level: selectedLevel, type, venue }, venues) &&
    (!selectedCat || c.categorySlug === selectedCat) &&
    (!selectedSub || c.subcategorySlug === selectedSub)
  ), [published, search, selectedCat, selectedSub, selectedLevel, type, venue, venues])

  const anyFilter = search || selectedCat || selectedLevel || type || venue
  const clearAll = () => { setSearch(''); setSelectedCat(''); setSelectedSub(''); setSelectedLevel(''); setType(''); setVenue('') }
  const pickCat = (slug) => { setSelectedCat(slug); setSelectedSub('') }
  const activeCat = categories.find(c => c.slug === selectedCat)

  return (
    <div>
      {/* Header */}
      <div className="bg-navy py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="section-label justify-center text-white/50">
            <span className="w-2 h-2 bg-gold rounded-full" /> Our Expertise
          </div>
          <h1 className="text-4xl font-black text-white mb-4">All Training Categories</h1>
          <div className="w-16 h-1.5 bg-gold rounded-full mx-auto mb-6" />
          <p className="text-white/70 text-sm max-w-xl mx-auto mb-8">
            {published.length}+ professional courses across {categories.length} high-impact disciplines. Find your path to mastery.
          </p>
          <div className="flex max-w-lg mx-auto">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by skill, topic or city…"
              className="flex-1 px-5 py-3 rounded-l-full border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-white text-sm backdrop-blur"
            />
            <button className="bg-gold text-navy px-6 py-3 rounded-r-full font-bold hover:bg-gold/90 transition-colors text-sm">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-white border-b py-5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => pickCat('')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!selectedCat ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-deep'}`}>
              All ({published.length})
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => pickCat(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCat === cat.slug ? 'bg-navy text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-deep'}`}>
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
          {/* Subcategory pills appear once a category is chosen */}
          {subOptions.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => setSelectedSub('')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${!selectedSub ? 'bg-gold text-navy border-gold' : 'bg-white text-gray-600 border-gray-200 hover:border-gold'}`}>
                All {activeCat?.name}
              </button>
              {subOptions.map(sc => (
                <button key={sc.id} onClick={() => setSelectedSub(sc.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selectedSub === sc.slug ? 'bg-gold text-navy border-gold' : 'bg-white text-gray-600 border-gray-200 hover:border-gold'}`}>
                  {sc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border-b py-3 px-6">
        <div className="max-w-7xl mx-auto flex gap-3 flex-wrap items-center">
          <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="input-field max-w-[150px] text-sm py-2" aria-label="Level">
            <option value="">All Levels</option>
            {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
          </select>
          <CourseFilters type={type} setType={setType} venue={venue} setVenue={setVenue} />
          {anyFilter && (
            <button onClick={clearAll} className="text-xs text-teal-deep font-semibold hover:underline ml-2">
              Clear all filters ×
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">{filteredCourses.length} courses found</span>
        </div>
      </div>

      {/* Category Cards (when no search/filter) */}
      {!anyFilter && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="section-title-h2 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map(cat => {
                const n = published.filter(c => c.categorySlug === cat.slug).length
                return (
                  <Link key={cat.id} to={`/training-categories/${cat.slug}`}
                    className={`p-5 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group ${categoryTile(cat.color)}`}>
                    <div className="text-3xl mb-3">{cat.icon}</div>
                    <h3 className="font-bold text-xs leading-tight mb-1 group-hover:underline">{cat.name}</h3>
                    <div className="text-xs opacity-70">{n || cat.courseCount || 0} courses</div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* All Courses Grid */}
      <section className="py-14 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          {activeCat && (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{activeCat.icon}</span>
              <h2 className="section-title-h2">{activeCat.name}</h2>
            </div>
          )}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📚</div>
              <h3 className="text-xl font-bold mb-2">No courses match your search</h3>
              <p className="text-sm mb-4">Try different keywords, another venue or browse all categories</p>
              <button onClick={clearAll} className="btn-secondary">Clear Filters</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => <CourseCard key={course.id} course={course} venue={venue} type={type} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
