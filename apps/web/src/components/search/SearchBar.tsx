import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { setQuery, getSearchSuggestions, clearSuggestions } from '@/store/slices/searchSlice'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useDebounce } from 'use-debounce'

const SearchBar: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { query, suggestions, isLoadingSuggestions } = useSelector((state: RootState) => state.search)
  const [localQuery, setLocalQuery] = useState(query)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [debouncedQuery] = useDebounce(localQuery, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Get suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery !== query) {
      dispatch(getSearchSuggestions(debouncedQuery) as any)
    }
  }, [debouncedQuery, dispatch, query])

  // Handle search submission
  const handleSearch = (searchQuery: string = localQuery) => {
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      dispatch(setQuery(trimmedQuery))
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    setShowSuggestions(value.trim().length > 0)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion)
    handleSearch(suggestion)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(localQuery.trim().length > 0)}
          placeholder="Search for anything..."
          className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent shadow-soft hover:shadow-medium transition-shadow dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 font-normal"
        />
        <button
          onClick={() => handleSearch()}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-brand-blue transition-colors dark:hover:text-gray-300"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-medium z-50 max-h-96 overflow-y-auto"
        >
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              Loading suggestions...
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white font-normal">{suggestion.text}</span>
                  {suggestion.count && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto font-normal">
                      {suggestion.count} results
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar