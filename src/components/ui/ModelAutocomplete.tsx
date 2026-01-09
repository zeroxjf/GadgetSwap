'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { DeviceModel } from '@/lib/device-models'

interface ModelAutocompleteProps {
  models: DeviceModel[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ModelAutocomplete({
  models,
  value,
  onChange,
  placeholder = 'Start typing to search...',
  disabled = false,
}: ModelAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get display label for current value
  const selectedModel = models.find(m => m.value === value)

  // Filter models based on input
  const filteredModels = inputValue.trim()
    ? models.filter(m => {
        const search = inputValue.toLowerCase()
        return (
          m.label.toLowerCase().includes(search) ||
          m.value.toLowerCase().includes(search)
        )
      })
    : models

  // Sort filtered results: exact matches first, then starts-with, then preserve original order
  // Original order is by release year (newest first) from device-models.ts
  const sortedModels = inputValue.trim()
    ? [...filteredModels].sort((a, b) => {
        const search = inputValue.toLowerCase()
        const aLabel = a.label.toLowerCase()
        const bLabel = b.label.toLowerCase()

        // Exact match
        if (aLabel === search) return -1
        if (bLabel === search) return 1

        // Starts with
        const aStarts = aLabel.startsWith(search)
        const bStarts = bLabel.startsWith(search)
        if (aStarts && !bStarts) return -1
        if (bStarts && !aStarts) return 1

        // Otherwise preserve original order (by release year)
        return models.indexOf(a) - models.indexOf(b)
      })
    : filteredModels // No search term = keep original order (by release year)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        // Reset input to selected value when closing
        setInputValue('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [inputValue])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = useCallback((model: DeviceModel) => {
    onChange(model.value)
    setInputValue('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < sortedModels.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (sortedModels[highlightedIndex]) {
          handleSelect(sortedModels[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setInputValue('')
        inputRef.current?.blur()
        break
      case 'Tab':
        setIsOpen(false)
        setInputValue('')
        break
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setInputValue('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? inputValue : (selectedModel?.label || '')}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setInputValue('')
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input pl-9 pr-16"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {sortedModels.length === 0 ? (
            <li className="px-4 py-3 text-gray-500 text-sm">
              No models found for "{inputValue}"
            </li>
          ) : (
            sortedModels.map((model, index) => (
              <li
                key={model.value}
                onClick={() => handleSelect(model)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-4 py-2 cursor-pointer text-sm ${
                  index === highlightedIndex
                    ? 'bg-primary-50 text-primary-900'
                    : 'hover:bg-gray-50'
                } ${model.value === value ? 'font-medium bg-primary-50' : ''}`}
              >
                <HighlightMatch text={model.label} query={inputValue} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

// Helper component to highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="font-semibold text-primary-600">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
