import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * A searchable dropdown that only accepts values from `options`.
 * Typing filters the list; the committed value only changes when
 * the user actually clicks/selects an option — this is what
 * enforces "must pick from the list" rather than free text.
 */
export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  emptyMessage = 'No matches',
}) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = (
    query.trim()
      ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
      : options
  ).slice(0, 40)

  function handleSelect(opt) {
    onChange(opt)
    setQuery(opt)
    setOpen(false)
  }

  function handleInputChange(e) {
    setQuery(e.target.value)
    onChange('') // clear the committed value until a real selection is made
    setOpen(true)
  }

  return (
    <div className="searchable-select" ref={wrapRef}>
      <div className="searchable-select-input-wrap">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <ChevronDown size={15} className="searchable-select-chevron" />
      </div>

      {open && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 && (
            <div className="searchable-select-empty">{emptyMessage}</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt}
              className="searchable-select-option"
              onMouseDown={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
