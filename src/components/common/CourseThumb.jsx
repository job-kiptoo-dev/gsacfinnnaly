import React, { useState } from 'react'
import { useSite } from '../../context/SiteContext'
import { normalizeCategoryColor } from '../../lib/categoryColors'

const FALLBACK_BG = {
  navy: 'from-navy to-navy-700',
  teal: 'from-navy to-teal-deep',
  gold: 'from-navy-800 to-gold-dark',
}

/**
 * Course thumbnail. Shows the image the admin uploaded; when a course has no image
 * (or it fails to load) a branded panel with the category icon is shown instead,
 * so cards never look broken.
 *
 * Size it from the outside, e.g. <CourseThumb course={c} className="h-40" />
 * Children render as overlays (badges).
 */
export default function CourseThumb({ course, className = 'h-40', children, zoom = true }) {
  const { categories } = useSite()
  const [failed, setFailed] = useState(false)
  const cat = categories.find(c => c.slug === course?.categorySlug)
  const bg = FALLBACK_BG[normalizeCategoryColor(cat?.color)]
  const showImage = course?.thumbnail && !failed

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${bg} ${className}`}>
      {showImage ? (
        <>
          <img
            src={course.thumbnail}
            alt={course.title || 'Course thumbnail'}
            loading="lazy"
            onError={() => setFailed(true)}
            className={`w-full h-full object-cover ${zoom ? 'group-hover:scale-105' : ''} transition-transform duration-500`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent pointer-events-none" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="text-5xl drop-shadow-sm">{cat?.icon || '📚'}</div>
          {(course?.subcategory || course?.category) && (
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/70 line-clamp-1">
              {course.subcategory || course.category}
            </div>
          )}
          <div className="absolute -right-4 -bottom-10 text-[9rem] leading-none font-black text-white/[0.05] select-none">
            {(course?.title || 'G').replace(/^Training on /i, '')[0]}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
