'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Shield,
  Loader2,
  Camera,
  Fingerprint,
  FileCheck,
  Copy,
  Save,
  Trash2,
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

const deviceColors = [
  'Black',
  'White',
  'Silver',
  'Space Gray',
  'Space Black',
  'Gold',
  'Rose Gold',
  'Natural Titanium',
  'Blue Titanium',
  'White Titanium',
  'Black Titanium',
  'Desert Titanium',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Red',
  'Pink',
  'Midnight',
  'Starlight',
  'Other',
]

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

// IMEI verification state type
interface IMEIVerification {
  imei: string
  isVerifying: boolean
  verified: boolean
  error: string | null
  rateLimited: boolean
  waitTime: number
  verifiedModel: string | null
}

// Verification code and photo state type
interface VerificationState {
  code: string | null
  isGenerating: boolean
  photoUrl: string | null
  isUploading: boolean
  aiScore: number | null
  aiResult: any | null
  safeSearch: {
    adult: string | null
    violence: string | null
    racy: string | null
  } | null
  error: string | null
}

function NewListingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get step from URL, default to 1
  const urlStep = parseInt(searchParams.get('step') || '1', 10)
  const [step, setStepState] = useState(urlStep >= 1 && urlStep <= 5 ? urlStep : 1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync step with URL changes (browser back/forward)
  useEffect(() => {
    const newStep = parseInt(searchParams.get('step') || '1', 10)
    if (newStep >= 1 && newStep <= 5 && newStep !== step) {
      setStepState(newStep)
    }
  }, [searchParams])

  // Navigate to a step and update URL
  const setStep = useCallback((newStep: number) => {
    if (newStep >= 1 && newStep <= 5) {
      setStepState(newStep)
      // Use router.push to add to history stack
      router.push(`/listings/new?step=${newStep}`, { scroll: false })
    }
  }, [router])
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

  // IMEI verification state
  const [imeiVerification, setImeiVerification] = useState<IMEIVerification>({
    imei: '',
    isVerifying: false,
    verified: false,
    error: null,
    rateLimited: false,
    waitTime: 0,
    verifiedModel: null,
  })

  // Verification code and photo state
  const [verification, setVerification] = useState<VerificationState>({
    code: null,
    isGenerating: false,
    photoUrl: null,
    isUploading: false,
    aiScore: null,
    aiResult: null,
    safeSearch: null,
    error: null,
  })

  // Track uploaded image URLs (from Cloudinary)
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])

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

    // Return policy
    acceptsReturns: false,
    returnWindowDays: 14,
  })

  // Draft saving state
  const DRAFT_KEY = 'gadgetswap_listing_draft'
  const [hasDraft, setHasDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showDraftRestored, setShowDraftRestored] = useState(false)

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY)
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        if (draft.formData) {
          setFormData(draft.formData)
          setHasDraft(true)
          setShowDraftRestored(true)
          // Hide the notification after 5 seconds
          setTimeout(() => setShowDraftRestored(false), 5000)
        }
        if (draft.images) {
          setImages(draft.images)
        }
        if (draft.isCurrentlyJailbroken !== undefined) {
          setIsCurrentlyJailbroken(draft.isCurrentlyJailbroken)
        }
        if (draft.lastSaved) {
          setLastSaved(new Date(draft.lastSaved))
        }
      }
    } catch (e) {
      console.error('Failed to load draft:', e)
    }
  }, [])

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    setIsSaving(true)
    try {
      const draft = {
        formData,
        images: images.filter(img => !img.startsWith('blob:')), // Only save uploaded URLs
        isCurrentlyJailbroken,
        lastSaved: new Date().toISOString(),
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setLastSaved(new Date())
      setHasDraft(true)
    } catch (e) {
      console.error('Failed to save draft:', e)
    }
    setIsSaving(false)
  }, [formData, images, isCurrentlyJailbroken])

  // Auto-save draft every 30 seconds if there are changes
  useEffect(() => {
    const hasContent = formData.title || formData.description || formData.deviceType || formData.price
    if (!hasContent) return

    const autoSaveTimer = setTimeout(() => {
      saveDraft()
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer)
  }, [formData, saveDraft])

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
    setLastSaved(null)
  }, [])

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Reset dependent fields when device type changes
      if (field === 'deviceType') {
        newData.deviceModel = ''
        newData.storageGB = ''
        // Reset IMEI verification when device type changes
        setImeiVerification({
          imei: '',
          isVerifying: false,
          verified: false,
          error: null,
          rateLimited: false,
          waitTime: 0,
          verifiedModel: null,
        })
      }

      // Reset storage when model changes
      if (field === 'deviceModel') {
        newData.storageGB = ''
      }

      return newData
    })
  }

  // Check if current device type requires IMEI
  const requiresIMEI = ['IPHONE', 'IPAD'].includes(formData.deviceType)

  // Verify IMEI
  const verifyIMEI = async () => {
    if (!imeiVerification.imei || imeiVerification.imei.length < 15) {
      setImeiVerification(prev => ({
        ...prev,
        error: 'Please enter a valid 15-digit IMEI',
        verified: false,
      }))
      return
    }

    setImeiVerification(prev => ({
      ...prev,
      isVerifying: true,
      error: null,
      rateLimited: false,
    }))

    try {
      const response = await fetch('/api/imei/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: imeiVerification.imei,
          deviceType: formData.deviceType,
          selectedModel: formData.deviceModel, // For model matching verification
        }),
      })

      const data = await response.json()

      if (response.status === 429) {
        setImeiVerification(prev => ({
          ...prev,
          isVerifying: false,
          rateLimited: true,
          waitTime: data.waitTime || 60,
          error: data.error || 'Too many requests. Please wait 1 minute.',
        }))
        return
      }

      if (!response.ok || !data.success) {
        setImeiVerification(prev => ({
          ...prev,
          isVerifying: false,
          verified: false,
          error: data.error || 'Verification failed',
        }))
        return
      }

      setImeiVerification(prev => ({
        ...prev,
        isVerifying: false,
        verified: true,
        error: null,
        verifiedModel: data.modelName || data.model || null,
      }))
    } catch (error) {
      setImeiVerification(prev => ({
        ...prev,
        isVerifying: false,
        verified: false,
        error: 'Failed to verify IMEI. Please try again.',
      }))
    }
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
    // Depend on actual values, not function references
  }, [formData.deviceType, formData.deviceModel, formData.storageGB, formData.jailbreakStatus])

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

    // Create object URLs for preview
    const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
    setImages((prev) => [...prev, ...newImages].slice(0, 10))
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Generate verification code when entering step 5
  const generateVerificationCode = async () => {
    setVerification((prev) => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await fetch('/api/listings/verification-code', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code')
      }

      setVerification((prev) => ({
        ...prev,
        code: data.code,
        isGenerating: false,
      }))
    } catch (error) {
      setVerification((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate code',
      }))
    }
  }

  // Upload image to Cloudinary
  const uploadToCloudinary = async (
    imageData: string,
    type: 'listing' | 'verification'
  ): Promise<{ url: string; publicId: string; aiScore?: number; aiResult?: any; safeSearch?: any } | null> => {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          type,
          folder: type === 'verification' ? 'verification' : 'listings',
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      return {
        url: data.url,
        publicId: data.publicId,
        aiScore: data.aiAnalysis?.aiGeneratedScore,
        aiResult: data.aiAnalysis,
        safeSearch: data.aiAnalysis?.safeSearch,
      }
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  // Handle verification photo upload
  const handleVerificationPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setVerification((prev) => ({ ...prev, isUploading: true, error: null }))

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const result = await uploadToCloudinary(base64, 'verification')

        if (!result) {
          throw new Error('Failed to upload verification photo')
        }

        setVerification((prev) => ({
          ...prev,
          photoUrl: result.url,
          isUploading: false,
          aiScore: result.aiScore || null,
          aiResult: result.aiResult || null,
          safeSearch: result.safeSearch ? {
            adult: result.safeSearch.adult,
            violence: result.safeSearch.violence,
            racy: result.safeSearch.racy,
          } : null,
        }))
      }
      reader.onerror = () => {
        throw new Error('Failed to read file')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setVerification((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }))
    }
  }

  // Copy verification code to clipboard
  const copyVerificationCode = () => {
    if (verification.code) {
      navigator.clipboard.writeText(verification.code)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Upload images to Cloudinary if we have blob URLs
      let finalImageUrls: string[] = [...uploadedImageUrls]
      const blobImages = images.filter((img) => img.startsWith('blob:'))

      if (blobImages.length > 0) {
        // Convert blob URLs to base64 and upload
        for (let i = 0; i < blobImages.length; i++) {
          const blobUrl = blobImages[i]
          try {
            // Fetch the blob
            const response = await fetch(blobUrl)
            const blob = await response.blob()

            // Convert to base64
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })

            // Upload to Cloudinary
            const result = await uploadToCloudinary(base64, 'listing')
            if (result) {
              finalImageUrls.push(result.url)
            }
          } catch (err) {
            console.error('Failed to upload image:', err)
          }
        }
      }

      // Build listing data with verification info
      const listingData: any = {
        ...formData,
        images: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        // Verification data
        verificationCode: verification.code,
        verificationPhotoUrl: verification.photoUrl,
        aiDetectionScore: verification.aiScore,
        aiDetectionResult: verification.aiResult,
        safeSearchAdult: verification.safeSearch?.adult,
        safeSearchViolence: verification.safeSearch?.violence,
        safeSearchRacy: verification.safeSearch?.racy,
      }

      // Add IMEI data if verified
      if (requiresIMEI && imeiVerification.verified) {
        listingData.imei = imeiVerification.imei
        listingData.imeiVerified = true
        listingData.imeiVerifiedModel = imeiVerification.verifiedModel
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing')
      }

      // Clear draft on successful submission
      clearDraft()

      // Redirect to the listing page with pending status message
      router.push(`/listings/${data.listing.id}?submitted=true`)
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
        // IMEI verification required for iPhones and iPads
        const imeiValid = !requiresIMEI || imeiVerification.verified
        return formData.title && formData.description && formData.price && hasStorage && !priceError && imeiValid
      case 3:
        return true // Optional step
      case 4:
        return true // Images optional
      case 5:
        // Verification code and photo required
        return verification.code && verification.photoUrl && !verification.isUploading
      default:
        return false
    }
  }

  // Generate verification code when entering step 5
  useEffect(() => {
    if (step === 5 && !verification.code && !verification.isGenerating) {
      generateVerificationCode()
    }
  }, [step, verification.code, verification.isGenerating])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Draft restored notification */}
        {showDraftRestored && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Save className="w-4 h-4" />
              <span className="text-sm">Draft restored from {lastSaved ? lastSaved.toLocaleString() : 'earlier'}</span>
            </div>
            <button
              onClick={() => setShowDraftRestored(false)}
              className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-block">
              ← Back to home
            </Link>
            <h1 className="text-2xl font-bold dark:text-white">Create a Listing</h1>
            <p className="text-gray-600 dark:text-gray-400">List your device in a few simple steps</p>
          </div>

          {/* Save/Clear draft buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            {hasDraft && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear your draft? This cannot be undone.')) {
                    clearDraft()
                    // Reset form to initial state
                    setFormData({
                      title: '',
                      description: '',
                      price: '',
                      deviceType: '',
                      deviceModel: '',
                      condition: '',
                      storageGB: '',
                      color: '',
                      carrier: '',
                      osVersion: '',
                      buildNumber: '',
                      jailbreakStatus: 'NOT_JAILBROKEN',
                      batteryHealth: '',
                      screenReplaced: false,
                      originalParts: true,
                      imeiClean: true,
                      icloudUnlocked: true,
                      acceptsReturns: false,
                      returnWindowDays: 14,
                    })
                    setImages([])
                    setIsCurrentlyJailbroken(false)
                    router.push('/listings/new?step=1', { scroll: false })
                  }
                }}
                className="btn-secondary text-sm flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Last saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Progress steps - horizontal on desktop */}
        <div className="hidden lg:flex items-center gap-2 mb-8 justify-center">
            {[
              { num: 1, label: 'Device' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'Jailbreak' },
              { num: 4, label: 'Photos' },
              { num: 5, label: 'Verify' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= s.num ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < 4 && (
                  <div
                    className={`w-8 h-0.5 mx-3 ${
                      step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
        </div>

        {/* Mobile progress steps */}
        <div className="lg:hidden mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Device' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'Jailbreak' },
              { num: 4, label: 'Photos' },
              { num: 5, label: 'Verify' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step >= s.num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : s.num}
                </div>
                <span
                  className={`ml-1 sm:ml-2 text-xs sm:text-sm hidden sm:inline ${
                    step >= s.num ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                {i < 4 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 ${
                      step > s.num ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:p-8">
          {/* Step 1: Device Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">What are you selling?</h2>

              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left column - Device Type & Model */}
                <div className="space-y-6">
                  {/* Device Type */}
                  <div>
                    <label className="label mb-2 block">Device Type *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {deviceTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateFormData('deviceType', type.value)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                            formData.deviceType === type.value
                              ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-900 dark:text-gray-100'
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
                </div>

                {/* Right column - Condition */}
                <div>
                  <label className="label mb-2 block">Condition *</label>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                    {conditions.map((condition) => (
                      <button
                        key={condition.value}
                        type="button"
                        onClick={() => updateFormData('condition', condition.value)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          formData.condition === condition.value
                            ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <span className={`font-medium block ${
                          formData.condition === condition.value
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>{condition.label}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {condition.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Listing Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Listing Details</h2>

              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left column - Title, Description, Specs */}
                <div className="space-y-5">
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
                      className="input min-h-[120px] lg:min-h-[100px]"
                      maxLength={5000}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.description.length}/5000 characters
                    </p>
                  </div>

                  {/* Storage, Color, Battery in a row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label mb-2 block text-sm">Storage *</label>
                      <select
                        value={formData.storageGB}
                        onChange={(e) => updateFormData('storageGB', e.target.value)}
                        className="input text-sm"
                        disabled={availableStorage.length === 0}
                      >
                        <option value="">
                          {availableStorage.length === 0 ? 'Select model' : 'Select'}
                        </option>
                        {availableStorage.map((size) => (
                          <option key={size} value={size}>
                            {size >= 1024 ? `${size / 1024}TB` : `${size}GB`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="color" className="label mb-2 block text-sm">
                        Color
                      </label>
                      <select
                        id="color"
                        value={formData.color}
                        onChange={(e) => updateFormData('color', e.target.value)}
                        className="input text-sm"
                      >
                        <option value="">Select</option>
                        {deviceColors.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="batteryHealth" className="label mb-2 block text-sm">
                        Max Battery %
                      </label>
                      <input
                        id="batteryHealth"
                        type="number"
                        value={formData.batteryHealth}
                        onChange={(e) => updateFormData('batteryHealth', e.target.value)}
                        placeholder="96"
                        className="input text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Carrier */}
                  {['IPHONE', 'IPAD'].includes(formData.deviceType) && (
                    <div>
                      <label className="label mb-2 block text-sm">Carrier</label>
                      <div className="flex flex-wrap gap-2">
                        {carriers.map((carrier) => (
                          <button
                            key={carrier}
                            type="button"
                            onClick={() => updateFormData('carrier', carrier)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              formData.carrier === carrier
                                ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {carrier}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IMEI Verification */}
                  {requiresIMEI && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-primary-600" />
                        <label className="label">IMEI Verification</label>
                        <span className="text-xs text-gray-500">(Required)</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Verify your device's IMEI to build buyer trust. Find it in Settings → General → About.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={imeiVerification.imei}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 15)
                            setImeiVerification(prev => ({
                              ...prev,
                              imei: value,
                              verified: false,
                              error: null,
                            }))
                          }}
                          onPaste={(e) => {
                            e.preventDefault()
                            const pasted = e.clipboardData.getData('text')
                            const cleaned = pasted.replace(/[\s\-]/g, '').replace(/\D/g, '').slice(0, 15)
                            setImeiVerification(prev => ({
                              ...prev,
                              imei: cleaned,
                              verified: false,
                              error: null,
                            }))
                          }}
                          placeholder="Enter 15-digit IMEI"
                          className={`input flex-1 font-mono ${
                            imeiVerification.verified
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                              : imeiVerification.error
                              ? 'border-red-500'
                              : ''
                          }`}
                          maxLength={15}
                        />
                        <button
                          type="button"
                          onClick={verifyIMEI}
                          disabled={imeiVerification.isVerifying || imeiVerification.imei.length < 15 || imeiVerification.verified}
                          className="btn-primary px-4 disabled:opacity-50 flex items-center gap-2"
                        >
                          {imeiVerification.isVerifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying
                            </>
                          ) : imeiVerification.verified ? (
                            <>
                              <Check className="w-4 h-4" />
                              Verified
                            </>
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>

                      {/* Character count */}
                      <p className="text-xs text-gray-400 mt-1">
                        {imeiVerification.imei.length}/15 digits
                      </p>

                      {/* Verification result */}
                      {imeiVerification.verified && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700">
                            IMEI verified
                            {imeiVerification.verifiedModel && ` - ${imeiVerification.verifiedModel}`}
                          </span>
                        </div>
                      )}

                      {/* Error message */}
                      {imeiVerification.error && !imeiVerification.verified && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-red-700">{imeiVerification.error}</span>
                        </div>
                      )}

                      {/* Rate limit message */}
                      {imeiVerification.rateLimited && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-yellow-700">
                            Too many verification attempts. Please wait {imeiVerification.waitTime} seconds before trying again.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hardware checkboxes */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
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

                  {/* Return Policy */}
                  <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptsReturns}
                        onChange={(e) => updateFormData('acceptsReturns', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Accept Returns</span>
                        <p className="text-xs text-gray-500">
                          Allow buyers to return for any reason within the window
                        </p>
                      </div>
                    </label>

                    {formData.acceptsReturns && (
                      <div className="mt-3 ml-8">
                        <label className="text-sm text-gray-700 mb-2 block">Return Window</label>
                        <div className="flex gap-2">
                          {[7, 14, 30].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => updateFormData('returnWindowDays', days)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                formData.returnWindowDays === days
                                  ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {days} days
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column - Pricing */}
                <div className="space-y-4">
                  {/* Pricing Info - shows once model + storage selected */}
                  {formData.deviceModel && formData.storageGB && formData.deviceType !== 'ACCESSORIES' && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                      {/* TechFare Market Value */}
                      <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-900 text-sm">Market Value</span>
                        </div>

                        {priceValidation.isLoading && (
                          <div className="flex items-center gap-2 text-blue-700">
                            <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        )}

                        {!priceValidation.isLoading && priceValidation.marketValue && (
                          <div>
                            <p className="text-xl font-bold text-blue-900">
                              ${priceValidation.marketValue.toFixed(2)}
                            </p>
                            <p className="text-xs text-blue-700">
                              Max: ${priceValidation.maxPrice?.toFixed(2)}
                            </p>
                          </div>
                        )}

                        {!priceValidation.isLoading && !priceValidation.marketValue && (
                          <p className="text-blue-700 text-sm">No data</p>
                        )}
                      </div>

                      {/* GadgetSwap Last Sold Price */}
                      <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-900 text-sm">Last Sold</span>
                        </div>

                        {lastSold.isLoading && (
                          <div className="flex items-center gap-2 text-green-700">
                            <span className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        )}

                        {!lastSold.isLoading && lastSold.found && lastSold.lastSoldPrice && (
                          <div>
                            <p className="text-xl font-bold text-green-900">
                              ${lastSold.lastSoldPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-green-700">
                              {lastSold.condition?.replace('_', ' ')}
                            </p>
                          </div>
                        )}

                        {!lastSold.isLoading && !lastSold.found && (
                          <p className="text-green-700 text-sm">No history</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Input */}
                  <div>
                    <label htmlFor="price" className="label mb-2 block">
                      Your Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => updateFormData('price', e.target.value)}
                        placeholder="0.00"
                        className={`input pl-10 text-lg font-semibold ${priceError ? 'border-red-500 focus:ring-red-500' : ''}`}
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

                  {/* Fee preview */}
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Fee Breakdown</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sale price</span>
                          <span>${parseFloat(formData.price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform fee (1%)</span>
                          <span className="text-red-600">-${(parseFloat(formData.price) * 0.01).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stripe fee (~3%)</span>
                          <span className="text-red-600">-${(parseFloat(formData.price) * 0.03).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                          <span>You receive</span>
                          <span className="text-green-600">${(parseFloat(formData.price) * 0.96).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Jailbreak Info */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">iOS Version & Jailbreak Info</h2>

              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left column - iOS Version inputs */}
                <div className="space-y-4">
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
                        Settings → General → About
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

                </div>

                {/* Right column - Jailbreak toggle & info */}
                <div className="space-y-4">
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

                  {/* Jailbreak info box */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Why iOS version matters</h4>
                    <p className="text-sm text-gray-600">
                      Buyers in the jailbreak community look for devices on specific iOS versions.
                      Devices on jailbreakable firmware often sell for a premium.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Add Photos</h2>
                  <p className="text-gray-600 text-sm">
                    Add up to 10 photos. The first photo will be the cover image.
                  </p>
                </div>
                {images.length === 0 && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Optional</span>
                )}
              </div>

              {/* Image upload - wider grid on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

          {/* Step 5: Verification */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-primary-600" />
                  Verify Your Listing
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  To prevent fraud, please photograph your device with the verification code visible.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left column - Verification Code */}
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-primary-700">Your Verification Code</span>
                      {verification.code && (
                        <button
                          type="button"
                          onClick={copyVerificationCode}
                          className="text-primary-600 hover:text-primary-800 p-1"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {verification.isGenerating ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        <span className="ml-2 text-primary-700">Generating code...</span>
                      </div>
                    ) : verification.code ? (
                      <div className="text-center">
                        <p className="text-4xl font-mono font-bold tracking-widest text-primary-900">
                          {verification.code}
                        </p>
                        <p className="text-xs text-primary-600 mt-2">
                          Write this code clearly on a piece of paper
                        </p>
                      </div>
                    ) : verification.error ? (
                      <div className="text-center text-red-600">
                        <p>{verification.error}</p>
                        <button
                          type="button"
                          onClick={generateVerificationCode}
                          className="mt-2 text-sm underline hover:no-underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Instructions */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-gray-600" />
                      How to verify
                    </h4>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li className="flex gap-2">
                        <span className="font-semibold text-gray-900">1.</span>
                        Write the code above on a piece of paper
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-gray-900">2.</span>
                        Place the paper next to your device
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-gray-900">3.</span>
                        Take a clear photo showing both the device and the code
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-gray-900">4.</span>
                        Upload the photo below
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Right column - Photo Upload */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-600" />
                      Verification Photo
                    </h4>

                    {verification.photoUrl ? (
                      <div className="space-y-3">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={verification.photoUrl}
                            alt="Verification photo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setVerification((prev) => ({
                                ...prev,
                                photoUrl: null,
                                aiScore: null,
                                aiResult: null,
                                safeSearch: null,
                              }))
                            }
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* AI Analysis Result */}
                        {verification.aiScore !== null && (
                          <div
                            className={`p-3 rounded-lg ${
                              verification.aiScore > 0.6
                                ? 'bg-red-50 border border-red-200'
                                : verification.aiScore > 0.3
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-green-50 border border-green-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {verification.aiScore > 0.6 ? (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              ) : verification.aiScore > 0.3 ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  verification.aiScore > 0.6
                                    ? 'text-red-700'
                                    : verification.aiScore > 0.3
                                    ? 'text-yellow-700'
                                    : 'text-green-700'
                                }`}
                              >
                                {verification.aiScore > 0.6
                                  ? 'Photo may be AI-generated or manipulated'
                                  : verification.aiScore > 0.3
                                  ? 'Photo flagged for manual review'
                                  : 'Photo looks authentic'}
                              </span>
                            </div>
                            {verification.aiScore > 0.3 && (
                              <p className="text-xs text-gray-600 mt-1">
                                Your listing will still be submitted but will require admin review.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500 hover:text-primary-600 transition-colors">
                          {verification.isUploading ? (
                            <>
                              <Loader2 className="w-10 h-10 animate-spin mb-3" />
                              <span className="text-sm">Uploading and analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-10 h-10 mb-3" />
                              <span className="font-medium">Upload verification photo</span>
                              <span className="text-sm text-gray-400 mt-1">
                                Click to select or drag and drop
                              </span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleVerificationPhotoUpload}
                          className="hidden"
                          disabled={verification.isUploading}
                        />
                      </label>
                    )}

                    {verification.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{verification.error}</p>
                      </div>
                    )}
                  </div>

                  {/* Review Notice */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Pending Review</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          After submission, your listing will be reviewed by our team before going live.
                          This usually takes less than 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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

            {step < 5 ? (
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
                {isSubmitting ? 'Submitting for Review...' : 'Submit for Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    }>
      <NewListingContent />
    </Suspense>
  )
}
