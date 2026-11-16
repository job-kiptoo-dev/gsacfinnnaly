import React from 'react'
import { useSite } from '../../context/SiteContext'
import { groupVenuesByRegion, venueLabel } from '../../lib/venues'
import { DELIVERY_MODES } from '../../lib/courses'

/** Training-type + venue dropdowns shared by all course listings */
export default function CourseFilters({ type, setType, venue, setVenue, selectClass = 'input-field max-w-[190px] text-sm py-2' }) {
  const { venues } = useSite()
  const groups = groupVenuesByRegion(venues)
  return (
    <>
      <select value={type} onChange={e => setType(e.target.value)} className={selectClass} aria-label="Training type">
        <option value="">All training types</option>
        {DELIVERY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={venue} onChange={e => setVenue(e.target.value)} className={selectClass} aria-label="Venue">
        <option value="">All venues</option>
        {groups.map(g => (
          <optgroup key={g.region} label={g.region}>
            {g.venues.map(v => <option key={v.id} value={v.name}>{venueLabel(v)}</option>)}
          </optgroup>
        ))}
      </select>
    </>
  )
}
