import React from 'react'
import { Link } from 'react-router-dom'
import CurrencyPrice from './CurrencyPrice'
import CourseThumb from './CourseThumb'
import { useSite } from '../../context/SiteContext'
import { getCourseModes, getCourseVenues, courseLink, shortText, MODE_META } from '../../lib/courses'

/** The standard course card: thumbnail, category › subcategory, text, training types, venue, price, date */
export default function CourseCard({ course, venue = '', type = '' }) {
  const { venues } = useSite()
  const modes = getCourseModes(course)
  const cv = getCourseVenues(course, venues)
  const inPerson = modes.includes('In-Person')

  return (
    <Link to={courseLink(course, { venue, type })} className="card group flex flex-col">
      <CourseThumb course={course} className="h-40">
        {course.featured && <span className="absolute top-3 left-3 tag-pill bg-gold text-navy text-xs">Featured</span>}
        <span className="absolute top-3 right-3 tag-pill bg-white text-navy text-xs font-bold shadow">{course.duration}</span>
      </CourseThumb>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="tag-pill bg-teal-50 text-teal-deep text-xs">{course.subcategory || course.category}</span>
          <span className="tag-pill bg-gray-100 text-gray-600 text-xs">{course.level}</span>
        </div>
        <h3 className="font-bold text-sm text-gray-800 leading-snug mb-2 group-hover:text-teal-deep transition-colors line-clamp-2">
          {course.title}
        </h3>
        {shortText(course) && <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{shortText(course)}</p>}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {modes.map(m => (
            <span key={m} className="tag-pill bg-navy-50 text-navy text-[11px]">{MODE_META[m].icon} {m}</span>
          ))}
        </div>
        {inPerson && cv.length > 0 && (
          <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <span>📍</span>
            <span className="line-clamp-1">
              {venue ? venue : cv.slice(0, 2).map(v => v.name).join(', ')}
              {!venue && cv.length > 2 ? ` +${cv.length - 2} more` : ''}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <CurrencyPrice amount={course.price} className="text-teal-deep font-black text-base" />
          {course.nextDate ? (
            <span className="text-xs text-gray-400">📅 {new Date(course.nextDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          ) : (
            <span className="text-xs text-teal-deep font-semibold group-hover:underline">View Details →</span>
          )}
        </div>
      </div>
    </Link>
  )
}
