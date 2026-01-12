'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

// Extend window to include Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete
        }
        event: {
          clearInstanceListeners: (instance: unknown) => void
        }
      }
    }
    initGooglePlaces: () => void
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace google.maps.places {
  interface Autocomplete {
    addListener(event: string, handler: () => void): void
    getPlace(): PlaceResult
  }
  interface AutocompleteOptions {
    types?: string[]
    componentRestrictions?: { country: string | string[] }
    fields?: string[]
  }
  interface PlaceResult {
    address_components?: AddressComponent[]
    formatted_address?: string
  }
  interface AddressComponent {
    long_name: string
    short_name: string
    types: string[]
  }
}

export interface AddressComponents {
  line1: string
  line2: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface AddressAutocompleteProps {
  value: AddressComponents
  onChange: (address: AddressComponents) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

// Track if script is loading to prevent duplicate loads
let isScriptLoading = false
let isScriptLoaded = false
const callbacks: (() => void)[] = []

function loadGooglePlacesScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve()
      return
    }

    if (isScriptLoading) {
      callbacks.push(() => resolve())
      return
    }

    isScriptLoading = true

    // Define callback before loading script
    window.initGooglePlaces = () => {
      isScriptLoaded = true
      isScriptLoading = false
      resolve()
      callbacks.forEach(cb => cb())
      callbacks.length = 0
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true
    script.onerror = () => {
      isScriptLoading = false
      reject(new Error('Failed to load Google Places API'))
    }
    document.head.appendChild(script)
  })
}

// Check if API key is configured
function hasGooglePlacesKey(): boolean {
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
  return Boolean(key && key.length > 10)
}

function parseAddressComponents(place: google.maps.places.PlaceResult): AddressComponents {
  const components = place.address_components || []

  let streetNumber = ''
  let route = ''
  let city = ''
  let state = ''
  let zipCode = ''
  let country = 'US'
  let subpremise = ''

  for (const component of components) {
    const types = component.types

    if (types.includes('street_number')) {
      streetNumber = component.long_name
    } else if (types.includes('route')) {
      route = component.long_name
    } else if (types.includes('subpremise')) {
      subpremise = component.long_name
    } else if (types.includes('locality') || types.includes('sublocality_level_1')) {
      city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name // Use short name for state (e.g., "CA" instead of "California")
    } else if (types.includes('postal_code')) {
      zipCode = component.long_name
    } else if (types.includes('country')) {
      country = component.short_name
    }
  }

  // Build line1 from street number and route
  const line1 = streetNumber && route
    ? `${streetNumber} ${route}`
    : route || place.formatted_address?.split(',')[0] || ''

  return {
    line1,
    line2: subpremise ? `#${subpremise}` : '',
    city,
    state,
    zipCode,
    country,
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'Start typing an address...',
  disabled = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)

  // Format the current address for display
  const formatAddress = useCallback((addr: AddressComponents): string => {
    if (!addr.line1) return ''
    const parts = [addr.line1]
    if (addr.line2) parts[0] += ` ${addr.line2}`
    if (addr.city) parts.push(addr.city)
    if (addr.state) parts.push(addr.state)
    if (addr.zipCode) parts.push(addr.zipCode)
    return parts.join(', ')
  }, [])

  // Initialize Google Places (if API key available)
  useEffect(() => {
    // If no API key, go straight to manual mode (no error message)
    if (!hasGooglePlacesKey()) {
      setIsLoading(false)
      setIsManualMode(true)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!

    loadGooglePlacesScript(apiKey)
      .then(() => {
        if (inputRef.current && !autocompleteRef.current) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: ['address'],
              componentRestrictions: { country: 'us' },
              fields: ['address_components', 'formatted_address'],
            }
          )

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace()
            if (place?.address_components) {
              const parsed = parseAddressComponents(place)
              onChange(parsed)
              setInputValue(formatAddress(parsed))
            }
          })
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load Google Places:', err)
        // Silently fall back to manual mode
        setIsLoading(false)
        setIsManualMode(true)
      })

    return () => {
      // Cleanup listener if needed
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange, formatAddress])

  // Update input value when value prop changes (e.g., when selecting saved address)
  useEffect(() => {
    const formatted = formatAddress(value)
    if (formatted && formatted !== inputValue) {
      setInputValue(formatted)
    }
  }, [value, formatAddress, inputValue])

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // If user clears the field, clear the address
    if (!e.target.value) {
      onChange({
        line1: '',
        line2: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      })
    }
  }

  if (isManualMode) {
    // Manual entry fields (default when no API key or on error)
    return (
      <div className={`space-y-4 ${className}`}>
        <div>
          <label className="label mb-1.5 block">Address Line 1 *</label>
          <input
            type="text"
            value={value.line1}
            onChange={(e) => onChange({ ...value, line1: e.target.value })}
            placeholder="123 Main Street"
            className="input"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="label mb-1.5 block">Address Line 2</label>
          <input
            type="text"
            value={value.line2}
            onChange={(e) => onChange({ ...value, line2: e.target.value })}
            placeholder="Apt, suite, unit, etc."
            className="input"
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1.5 block">City *</label>
            <input
              type="text"
              value={value.city}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="City"
              className="input"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label mb-1.5 block">State *</label>
            <input
              type="text"
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder="State"
              className="input"
              maxLength={2}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1.5 block">ZIP Code *</label>
            <input
              type="text"
              value={value.zipCode}
              onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
              placeholder="ZIP Code"
              className="input"
              maxLength={10}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Country</label>
            <input
              type="text"
              value={value.country}
              disabled
              className="input bg-gray-50"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={isLoading ? 'Loading...' : placeholder}
          className="input pl-10"
          disabled={disabled || isLoading}
          autoComplete="off"
        />
      </div>

      {/* Show parsed address fields for verification/editing */}
      {value.line1 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-gray-700">Confirm your address:</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Street Address</label>
              <input
                type="text"
                value={value.line1}
                onChange={(e) => onChange({ ...value, line1: e.target.value })}
                className="input text-sm"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Apt/Suite/Unit</label>
              <input
                type="text"
                value={value.line2}
                onChange={(e) => onChange({ ...value, line2: e.target.value })}
                placeholder="Optional"
                className="input text-sm"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">City</label>
              <input
                type="text"
                value={value.city}
                onChange={(e) => onChange({ ...value, city: e.target.value })}
                className="input text-sm"
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">State</label>
                <input
                  type="text"
                  value={value.state}
                  onChange={(e) => onChange({ ...value, state: e.target.value })}
                  className="input text-sm"
                  maxLength={2}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ZIP</label>
                <input
                  type="text"
                  value={value.zipCode}
                  onChange={(e) => onChange({ ...value, zipCode: e.target.value })}
                  className="input text-sm"
                  maxLength={10}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
