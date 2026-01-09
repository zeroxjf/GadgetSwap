'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Upload,
  X,
  Info,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Smartphone,
  HardDrive,
  Battery,
  Check,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { getModelsForDeviceType, getStorageForModel, DeviceModel } from '@/lib/device-models'
import { checkJailbreakCompatibility, JailbreakResult } from '@/lib/jailbreak-compatibility'
import { ModelAutocomplete } from '@/components/ui/ModelAutocomplete'

const deviceTypes = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'MACBOOK', label: 'MacBook' },
  { value: 'IMAC', label: 'iMac' },
  { value: 'MAC_MINI', label: 'Mac Mini' },
  { value: 'MAC_STUDIO', label: 'Mac Studio' },
  { value: 'MAC_PRO', label: 'Mac Pro' },
  { value: 'APPLE_WATCH', label: 'Apple Watch' },
  { value: 'APPLE_TV', label: 'Apple TV' },
  { value: 'AIRPODS', label: 'AirPods' },
  { value: 'ACCESSORIES', label: 'Accessories' },
]

const conditions = [
  { value: 'NEW', label: 'New', description: 'Sealed, never opened' },
  { value: 'LIKE_NEW', label: 'Like New', description: 'Perfect condition, minimal use' },
  { value: 'EXCELLENT', label: 'Excellent', description: 'Minor signs of use, fully functional' },
  { value: 'GOOD', label: 'Good', description: 'Some visible wear, fully functional' },
  { value: 'FAIR', label: 'Fair', description: 'Noticeable wear, functional' },
  { value: 'POOR', label: 'Poor', description: 'Heavy wear, may have issues' },
  { value: 'FOR_PARTS', label: 'For Parts', description: 'Not working, for parts/repair' },
]

const jailbreakStatuses = [
  { value: 'NOT_JAILBROKEN', label: 'Not Jailbroken', description: 'Stock iOS, never jailbroken' },
  { value: 'JAILBREAKABLE', label: 'Jailbreakable', description: 'On a jailbreakable iOS version' },
  { value: 'JAILBROKEN', label: 'Currently Jailbroken', description: 'Actively jailbroken' },
  { value: 'UNKNOWN', label: 'Unknown', description: 'Not sure about jailbreak status' },
]

const carriers = ['Unlocked', 'AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'Other']

// Price validation state type
interface PriceValidation {
  marketValue: number | null
  maxPrice: number | null
  isJailbreakable: boolean
  jailbreakPremium: number
  isLoading: boolean
  error: string | null
}

// Last sold on GadgetSwap state type
interface LastSoldData {
  found: boolean
  lastSoldPrice: number | null
  soldAt: string | null
  condition: string | null
  isLoading: boolean
}

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])

  // Price validation state
  const [priceValidation, setPriceValidation] = useState<PriceValidation>({
    marketValue: null,
    maxPrice: null,
    isJailbreakable: false,
    jailbreakPremium: 1.0,
    isLoading: false,
    error: null,
  })
  const [priceError, setPriceError] = useState<string | null>(null)

  // Last sold on GadgetSwap state
  const [lastSold, setLastSold] = useState<LastSoldData>({
    found: false,
    lastSoldPrice: null,
    soldAt: null,
    condition: null,
    isLoading: false,
  })

  // Auto-detected jailbreak compatibility
  const [jailbreakCompat, setJailbreakCompat] = useState<JailbreakResult | null>(null)
  const [isCurrentlyJailbroken, setIsCurrentlyJailbroken] = useState(false)

  const [formData, setFormData] = useState({
    // Basic info
    title: '',
    description: '',
    price: '',
    deviceType: '',
    deviceModel: '',
    condition: '',

    // Device specs
    storageGB: '',
    color: '',
    carrier: '',

    // iOS info
    osVersion: '',
    buildNumber: '',
    jailbreakStatus: 'NOT_JAILBROKEN',

    // Hardware
    batteryHealth: '',
    screenReplaced: false,
    originalParts: true,
    imeiClean: true,
    icloudUnlocked: true,
  })

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Reset dependent fields when device type changes
      if (field === 'deviceType') {
        newData.deviceModel = ''
        newData.storageGB = ''
      }

      // Reset storage when model changes
      if (field === 'deviceModel') {
        newData.storageGB = ''
      }

      return newData
    })
  }

  // Get available models for selected device type
  const availableModels = useMemo(() => {
    return getModelsForDeviceType(formData.deviceType)
  }, [formData.deviceType])

  // Get available storage options for selected model
  const availableStorage = useMemo(() => {
    if (!formData.deviceType || !formData.deviceModel) return []
    return getStorageForModel(formData.deviceType, formData.deviceModel)
  }, [formData.deviceType, formData.deviceModel])

  // Fetch last sold price on GadgetSwap
  const fetchLastSold = useCallback(async () => {
    if (!formData.deviceModel || !formData.storageGB || formData.deviceType === 'ACCESSORIES') {
      setLastSold({
        found: false,
        lastSoldPrice: null,
        soldAt: null,
        condition: null,
        isLoading: false,
      })
      return
    }

    setLastSold((prev) => ({ ...prev, isLoading: true }))

    try {
      const params = new URLSearchParams({
        deviceModel: formData.deviceModel,
        storageGB: formData.storageGB,
      })
      const response = await fetch(`/api/listings/last-sold?${params}`)
      const data = await response.json()

      setLastSold({
        found: data.found || false,
        lastSoldPrice: data.lastSoldPrice || null,
        soldAt: data.soldAt || null,
        condition: data.condition || null,
        isLoading: false,
      })
    } catch (error) {
      setLastSold((prev) => ({ ...prev, isLoading: false }))
    }
  }, [formData.deviceType, formData.deviceModel, formData.storageGB])

  // Fetch price validation from TechFare when device info changes
  const fetchPriceValidation = useCallback(async () => {
    // Only fetch for devices with model and storage set (excluding accessories and devices without storage)
    if (!formData.deviceModel || !formData.storageGB || formData.deviceType === 'ACCESSORIES') {
      setPriceValidation({
        marketValue: null,
        maxPrice: null,
        isJailbreakable: false,
        jailbreakPremium: 1.0,
        isLoading: false,
        error: null,
      })
      return
    }

    setPriceValidation((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/listings/validate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceModel: formData.deviceModel,
          storageGB: parseInt(formData.storageGB, 10),
          jailbreakStatus: formData.jailbreakStatus,
        }),
      })

      const data = await response.json()

      setPriceValidation({
        marketValue: data.marketValue,
        maxPrice: data.maxPrice,
        isJailbreakable: data.isJailbreakable || false,
        jailbreakPremium: data.jailbreakPremium || 1.0,
        isLoading: false,
        error: data.error || null,
      })
    } catch (error) {
      setPriceValidation((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch market value',
      }))
    }
  }, [formData.deviceType, formData.deviceModel, formData.storageGB, formData.jailbreakStatus])

  // Fetch price validation and last sold when relevant fields change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPriceValidation()
      fetchLastSold()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [fetchPriceValidation, fetchLastSold])

  // Validate price against max price
  useEffect(() => {
    if (!formData.price || !priceValidation.maxPrice) {
      setPriceError(null)
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price)) {
      setPriceError(null)
      return
    }

    if (price > priceValidation.maxPrice) {
      setPriceError(
        `Price exceeds maximum of $${priceValidation.maxPrice.toFixed(2)}`
      )
    } else {
      setPriceError(null)
    }
  }, [formData.price, priceValidation.maxPrice, priceValidation.isJailbreakable])

  // Auto-detect jailbreak compatibility when device model or iOS version changes
  useEffect(() => {
    if (!formData.deviceModel || !formData.osVersion) {
      setJailbreakCompat(null)
      return
    }

    // Only check for iOS devices (iPhone, iPad)
    if (!['IPHONE', 'IPAD'].includes(formData.deviceType)) {
      setJailbreakCompat(null)
      return
    }

    const result = checkJailbreakCompatibility(formData.deviceModel, formData.osVersion)
    setJailbreakCompat(result)

    // Auto-update jailbreak status based on compatibility
    if (result.canJailbreak) {
      if (!isCurrentlyJailbroken) {
        updateFormData('jailbreakStatus', 'JAILBREAKABLE')
      }
    } else if (result.status === 'NOT_JAILBROKEN') {
      updateFormData('jailbreakStatus', 'NOT_JAILBROKEN')
    }
  }, [formData.deviceModel, formData.osVersion, formData.deviceType, isCurrentlyJailbroken])

  // Update jailbreak status when user toggles "currently jailbroken"
  useEffect(() => {
    if (isCurrentlyJailbroken && jailbreakCompat?.canJailbreak) {
      updateFormData('jailbreakStatus', 'JAILBROKEN')
    } else if (jailbreakCompat?.canJailbreak) {
      updateFormData('jailbreakStatus', 'JAILBREAKABLE')
    }
  }, [isCurrentlyJailbroken, jailbreakCompat])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // In production, you'd upload to cloud storage
    // For now, just create object URLs
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
    setImages((prev) => [...prev, ...newImages].slice(0, 10))
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Note: blob URLs from local file selection don't persist
      // In production, images would be uploaded to cloud storage first
      // For now, we skip images unless they're actual URLs
      const persistentImages = images.filter(img => !img.startsWith('blob:'))

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: persistentImages.length > 0 ? persistentImages : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing')
      }

      // Redirect to the new listing page
      router.push(`/listings/${data.listing.id}`)
    } catch (error) {
      console.error('Failed to create listing:', error)
      alert(error instanceof Error ? error.message : 'Failed to create listing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.deviceType && formData.deviceModel && formData.condition
      case 2:
        // Check for price error - don't allow proceeding if price exceeds max
        // Storage is required for devices that have storage options
        const needsStorage = availableStorage.length > 0
        const hasStorage = !needsStorage || formData.storageGB
        return formData.title && formData.description && formData.price && hasStorage && !priceError
      case 3:
        return true // Optional step
      case 4:
        return true // Images optional for now (cloud storage not implemented)
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-2xl font-bold">Create a Listing</h1>
          <p className="text-gray-600">List your device in a few simple steps</p>
        </div>

        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Device' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'Jailbreak' },
              { num: 4, label: 'Photos' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= s.num ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < 3 && (
                  <div
                    className={`hidden sm:block w-16 h-0.5 mx-4 ${
                      step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          {/* Step 1: Device Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">What are you selling?</h2>

              {/* Device Type */}
              <div>
                <label className="label mb-2 block">Device Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {deviceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFormData('deviceType', type.value)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.deviceType === type.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Model */}
              <div>
                <label htmlFor="deviceModel" className="label mb-2 block">
                  Model *
                </label>
                {formData.deviceType && formData.deviceType !== 'ACCESSORIES' ? (
                  <ModelAutocomplete
                    models={availableModels}
                    value={formData.deviceModel}
                    onChange={(value) => updateFormData('deviceModel', value)}
                    placeholder="Type to search models (e.g., iPhone 17)"
                    disabled={!formData.deviceType}
                  />
                ) : formData.deviceType === 'ACCESSORIES' ? (
                  <input
                    id="deviceModel"
                    type="text"
                    value={formData.deviceModel}
                    onChange={(e) => updateFormData('deviceModel', e.target.value)}
                    placeholder="Enter accessory name"
                    className="input"
                  />
                ) : null}
                {!formData.deviceType && (
                  <p className="text-sm text-gray-500 mt-1">Select a device type first</p>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="label mb-2 block">Condition *</label>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <button
                      key={condition.value}
                      type="button"
                      onClick={() => updateFormData('condition', condition.value)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        formData.condition === condition.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{condition.label}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        — {condition.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Listing Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Listing Details</h2>

              {/* Title */}
              <div>
                <label htmlFor="title" className="label mb-2 block">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="e.g., iPhone 14 Pro Max 256GB - iOS 16.1.2"
                  className="input"
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="label mb-2 block">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe your device's condition, included accessories, and any relevant details..."
                  className="input min-h-[150px]"
                  maxLength={5000}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              {/* Storage & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2 block">Storage *</label>
                  <select
                    value={formData.storageGB}
                    onChange={(e) => updateFormData('storageGB', e.target.value)}
                    className="input"
                    disabled={availableStorage.length === 0}
                  >
                    <option value="">
                      {availableStorage.length === 0 ? 'Select model first' : 'Select storage'}
                    </option>
                    {availableStorage.map((size) => (
                      <option key={size} value={size}>
                        {size >= 1024 ? `${size / 1024}TB` : `${size}GB`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="color" className="label mb-2 block">
                    Color
                  </label>
                  <input
                    id="color"
                    type="text"
                    value={formData.color}
                    onChange={(e) => updateFormData('color', e.target.value)}
                    placeholder="e.g., Space Black"
                    className="input"
                  />
                </div>
              </div>

              {/* Pricing Info - shows once model + storage selected */}
              {formData.deviceModel && formData.storageGB && formData.deviceType !== 'ACCESSORIES' && (
                <div className="space-y-3">
                  {/* TechFare Market Value */}
                  <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">TechFare Market Value</span>
                    </div>

                    {priceValidation.isLoading && (
                      <div className="flex items-center gap-2 text-blue-700">
                        <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        <span>Fetching market value...</span>
                      </div>
                    )}

                    {!priceValidation.isLoading && priceValidation.marketValue && (
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-blue-900">
                          ${priceValidation.marketValue.toFixed(2)}
                        </p>
                        <p className="text-sm text-blue-700">
                          Maximum listing price:{' '}
                          <span className="font-bold">${priceValidation.maxPrice?.toFixed(2)}</span>
                          <span className="ml-1 text-gray-500">(1.5x market value)</span>
                        </p>
                      </div>
                    )}

                    {!priceValidation.isLoading && !priceValidation.marketValue && priceValidation.error && (
                      <div className="text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        {priceValidation.error}
                      </div>
                    )}

                    {!priceValidation.isLoading && !priceValidation.marketValue && !priceValidation.error && (
                      <p className="text-blue-700 text-sm">
                        No market data available for this device
                      </p>
                    )}
                  </div>

                  {/* GadgetSwap Last Sold Price */}
                  <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Last Sold on GadgetSwap</span>
                    </div>

                    {lastSold.isLoading && (
                      <div className="flex items-center gap-2 text-green-700">
                        <span className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                        <span>Checking sales history...</span>
                      </div>
                    )}

                    {!lastSold.isLoading && lastSold.found && lastSold.lastSoldPrice && (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-900">
                          ${lastSold.lastSoldPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-green-700">
                          {lastSold.condition && (
                            <span>Condition: {lastSold.condition.replace('_', ' ')}</span>
                          )}
                          {lastSold.soldAt && (
                            <span className="ml-2">
                              ({new Date(lastSold.soldAt).toLocaleDateString()})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {!lastSold.isLoading && !lastSold.found && (
                      <p className="text-green-700 text-sm">
                        No previous sales on GadgetSwap for this device
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <label htmlFor="price" className="label mb-2 block">
                  Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateFormData('price', e.target.value)}
                    placeholder="0.00"
                    className={`input pl-10 ${priceError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Price validation feedback */}
                {priceError && (
                  <div className="flex items-start gap-2 p-3 mt-2 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{priceError}</p>
                  </div>
                )}

                {!priceError && formData.price && priceValidation.maxPrice && parseFloat(formData.price) <= priceValidation.maxPrice && (
                  <div className="flex items-center gap-2 text-green-600 mt-2">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Price is within allowed range</span>
                  </div>
                )}
              </div>

              {/* Carrier */}
              {['IPHONE', 'IPAD'].includes(formData.deviceType) && (
                <div>
                  <label className="label mb-2 block">Carrier</label>
                  <div className="flex flex-wrap gap-2">
                    {carriers.map((carrier) => (
                      <button
                        key={carrier}
                        type="button"
                        onClick={() => updateFormData('carrier', carrier)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          formData.carrier === carrier
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {carrier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Battery & Hardware */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="batteryHealth" className="label mb-2 block">
                    Battery Health %
                  </label>
                  <input
                    id="batteryHealth"
                    type="number"
                    value={formData.batteryHealth}
                    onChange={(e) => updateFormData('batteryHealth', e.target.value)}
                    placeholder="e.g., 96"
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.originalParts}
                      onChange={(e) => updateFormData('originalParts', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm">Original Parts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.imeiClean}
                      onChange={(e) => updateFormData('imeiClean', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm">Clean IMEI</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.icloudUnlocked}
                      onChange={(e) => updateFormData('icloudUnlocked', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm">iCloud Unlocked</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Jailbreak Info */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">iOS Version & Jailbreak Info</h2>

              {/* iOS Version Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="osVersion" className="label mb-2 block">
                    iOS/macOS Version *
                  </label>
                  <input
                    id="osVersion"
                    type="text"
                    value={formData.osVersion}
                    onChange={(e) => updateFormData('osVersion', e.target.value)}
                    placeholder="e.g., 16.1.2"
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Settings → General → About → iOS Version
                  </p>
                </div>
                <div>
                  <label htmlFor="buildNumber" className="label mb-2 block">
                    Build Number
                  </label>
                  <input
                    id="buildNumber"
                    type="text"
                    value={formData.buildNumber}
                    onChange={(e) => updateFormData('buildNumber', e.target.value)}
                    placeholder="e.g., 20B110"
                    className="input"
                  />
                </div>
              </div>

              {/* Auto-detected Jailbreak Compatibility */}
              {['IPHONE', 'IPAD'].includes(formData.deviceType) && formData.osVersion && (
                <div className={`p-4 rounded-lg border-2 ${
                  jailbreakCompat?.canJailbreak
                    ? 'border-green-500 bg-green-50'
                    : jailbreakCompat?.status === 'NOT_JAILBROKEN'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-start gap-3">
                    {jailbreakCompat?.canJailbreak ? (
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : jailbreakCompat?.status === 'NOT_JAILBROKEN' ? (
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    ) : (
                      <Info className="w-6 h-6 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        jailbreakCompat?.canJailbreak ? 'text-green-900' :
                        jailbreakCompat?.status === 'NOT_JAILBROKEN' ? 'text-red-900' :
                        'text-gray-700'
                      }`}>
                        {jailbreakCompat?.canJailbreak
                          ? 'This device is jailbreakable!'
                          : jailbreakCompat?.status === 'NOT_JAILBROKEN'
                          ? 'Not jailbreakable on this iOS version'
                          : 'Checking compatibility...'}
                      </h3>

                      {jailbreakCompat?.canJailbreak && (
                        <>
                          <p className="text-sm text-green-700 mt-1">
                            {formData.deviceModel} on iOS {formData.osVersion} can be jailbroken
                          </p>

                          {/* Available tools */}
                          {jailbreakCompat.tools.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-green-800 mb-2">Available jailbreak tools:</p>
                              <div className="flex flex-wrap gap-2">
                                {jailbreakCompat.tools.map((tool, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-green-300 text-green-800"
                                  >
                                    {tool.name}
                                    <span className="ml-1 text-green-600 text-xs">({tool.type})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* checkm8 badge */}
                          {jailbreakCompat.hasBootromExploit && (
                            <div className="mt-3 inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                              <Smartphone className="w-4 h-4" />
                              checkm8 bootrom exploit available
                            </div>
                          )}
                        </>
                      )}

                      {jailbreakCompat?.status === 'NOT_JAILBROKEN' && (
                        <p className="text-sm text-red-700 mt-1">
                          No jailbreak is currently available for {formData.deviceModel} on iOS {formData.osVersion}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Data from <a href="https://ios.cfw.guide" target="_blank" rel="noopener noreferrer" className="underline">ios.cfw.guide</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-iOS device message */}
              {!['IPHONE', 'IPAD'].includes(formData.deviceType) && (
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-gray-600 text-sm">
                    Jailbreak compatibility checking is only available for iPhone and iPad devices.
                  </p>
                </div>
              )}

              {/* Currently Jailbroken Toggle */}
              {jailbreakCompat?.canJailbreak && (
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    checked={isCurrentlyJailbroken}
                    onChange={(e) => setIsCurrentlyJailbroken(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600"
                  />
                  <div>
                    <span className="font-medium text-purple-900">This device is currently jailbroken</span>
                    <p className="text-sm text-purple-700">
                      Check this if the device has an active jailbreak installed
                    </p>
                  </div>
                </label>
              )}

            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Add Photos</h2>
              <p className="text-gray-600">
                Add up to 10 photos. The first photo will be the cover image.
              </p>

              {/* Image upload */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 10 && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {images.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  Photos are optional for now. You can publish without images and add them later.
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="btn-primary px-8 disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
