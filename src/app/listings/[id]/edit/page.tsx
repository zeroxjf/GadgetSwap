'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Upload,
  X,
  ChevronLeft,
  DollarSign,
  Battery,
  Check,
  AlertTriangle,
  Loader2,
  Save,
  Eye,
} from 'lucide-react'
import { getModelsForDeviceType, getStorageForModel } from '@/lib/device-models'
import { ModelAutocomplete } from '@/components/ui/ModelAutocomplete'

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
  { value: 'NOT_JAILBROKEN', label: 'Stock', description: 'Not jailbreakable' },
  { value: 'JAILBREAKABLE', label: 'Jailbreakable', description: 'On a jailbreakable iOS version' },
  { value: 'UNKNOWN', label: 'Unknown', description: 'Not sure' },
]

const carriers = ['Unlocked', 'AT&T', 'Verizon', 'T-Mobile', 'Sprint', 'Other']

const deviceColors = [
  'Black', 'White', 'Silver', 'Space Gray', 'Space Black', 'Gold', 'Rose Gold',
  'Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium', 'Desert Titanium',
  'Blue', 'Green', 'Yellow', 'Purple', 'Red', 'Pink', 'Midnight', 'Starlight', 'Other',
]

interface Listing {
  id: string
  title: string
  description: string
  price: number
  deviceType: string
  deviceModel: string
  condition: string
  storageGB: number | null
  color: string | null
  carrier: string | null
  osVersion: string | null
  buildNumber: string | null
  jailbreakStatus: string
  batteryHealth: number | null
  screenReplaced: boolean | null
  originalParts: boolean
  imeiClean: boolean
  icloudUnlocked: boolean
  status: string
  reviewStatus: string
  images: { id: string; url: string; order: number }[]
  seller: { id: string }
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
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
  })

  const [images, setImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<string[]>([]) // Blob URLs for new uploads

  // Load listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${id}`)
        if (!response.ok) {
          throw new Error('Listing not found')
        }
        const data = await response.json()
        const l = data.listing as Listing

        // Check ownership
        if (session?.user?.id && l.seller.id !== session.user.id) {
          setError('You can only edit your own listings')
          return
        }

        setListing(l)
        setFormData({
          title: l.title || '',
          description: l.description || '',
          price: l.price ? String(l.price) : '',
          condition: l.condition || '',
          storageGB: l.storageGB ? String(l.storageGB) : '',
          color: l.color || '',
          carrier: l.carrier || '',
          osVersion: l.osVersion || '',
          buildNumber: l.buildNumber || '',
          jailbreakStatus: l.jailbreakStatus || 'NOT_JAILBROKEN',
          batteryHealth: l.batteryHealth ? String(l.batteryHealth) : '',
          screenReplaced: l.screenReplaced || false,
          originalParts: l.originalParts ?? true,
          imeiClean: l.imeiClean ?? true,
          icloudUnlocked: l.icloudUnlocked ?? true,
        })
        setImages(l.images.map(img => img.url))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }

    if (authStatus === 'authenticated') {
      fetchListing()
    } else if (authStatus === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/listings/${id}/edit`)
    }
  }, [id, session?.user?.id, authStatus, router])

  // Get available storage options
  const availableStorage = useMemo(() => {
    if (!listing?.deviceType || !listing?.deviceModel) return []
    return getStorageForModel(listing.deviceType, listing.deviceModel)
  }, [listing?.deviceType, listing?.deviceModel])

  // Get available models for autocomplete
  const availableModels = useMemo(() => {
    if (!listing?.deviceType) return []
    return getModelsForDeviceType(listing.deviceType)
  }, [listing?.deviceType])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const urls = Array.from(files).map(file => URL.createObjectURL(file))
    setNewImages(prev => [...prev, ...urls].slice(0, 10 - images.length))
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  // Upload image to Cloudinary
  const uploadToCloudinary = async (blobUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(blobUrl)
      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, type: 'listing', folder: 'listings' }),
      })
      const data = await uploadResponse.json()
      return data.url || null
    } catch (err) {
      console.error('Upload error:', err)
      return null
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Upload any new images
      let finalImages = [...images]
      for (const blobUrl of newImages) {
        const uploadedUrl = await uploadToCloudinary(blobUrl)
        if (uploadedUrl) {
          finalImages.push(uploadedUrl)
        }
      }

      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: finalImages,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update listing')
      }

      setSuccess(true)
      setSuccessMessage(data.message || 'Changes saved successfully!')
      setImages(finalImages)
      setNewImages([])

      // Redirect after brief success message
      setTimeout(() => {
        router.push(`/listings/${id}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link href="/account/listings" className="btn-primary">
              Back to My Listings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) return null

  const canEdit = listing.status !== 'SOLD'
  const isPending = listing.reviewStatus === 'PENDING_REVIEW'
  const isRejected = listing.reviewStatus === 'REJECTED'
  const needsInfo = listing.reviewStatus === 'NEEDS_INFO'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/listings/${id}`}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to listing
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Listing</h1>
              {isPending && (
                <p className="text-yellow-600 text-sm mt-1">This listing is pending review</p>
              )}
              {isRejected && (
                <p className="text-red-600 text-sm mt-1">This listing was rejected - make changes and resubmit</p>
              )}
              {needsInfo && (
                <p className="text-orange-600 text-sm mt-1">Additional information required</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/listings/${id}`}
                className="btn-secondary flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </Link>
            </div>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">{successMessage} Redirecting...</span>
          </div>
        )}

        {/* Error message */}
        {error && listing && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {!canEdit ? (
          <div className="card p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cannot Edit</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This listing has been sold and cannot be edited.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="label mb-2 block">Title</label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="input"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="label mb-2 block">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="input min-h-[120px]"
                    maxLength={5000}
                  />
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="price" className="label mb-2 block">Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateFormData('price', e.target.value)}
                      className="input pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="label mb-2 block">Condition</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {conditions.map((condition) => (
                      <button
                        key={condition.value}
                        type="button"
                        onClick={() => updateFormData('condition', condition.value)}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          formData.condition === condition.value
                            ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className={`font-medium text-sm block ${
                          formData.condition === condition.value
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>{condition.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Device Specs */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Device Specifications</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Device Model (read-only) */}
                <div>
                  <label className="label mb-2 block">Device Model</label>
                  <input
                    type="text"
                    value={listing.deviceModel}
                    disabled
                    className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Model cannot be changed</p>
                </div>

                {/* Storage */}
                <div>
                  <label className="label mb-2 block">Storage</label>
                  <select
                    value={formData.storageGB}
                    onChange={(e) => updateFormData('storageGB', e.target.value)}
                    className="input"
                  >
                    <option value="">Select</option>
                    {availableStorage.map((size) => (
                      <option key={size} value={size}>
                        {size >= 1024 ? `${size / 1024}TB` : `${size}GB`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="label mb-2 block">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => updateFormData('color', e.target.value)}
                    className="input"
                  >
                    <option value="">Select</option>
                    {deviceColors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                {/* Battery Health */}
                <div>
                  <label className="label mb-2 block">Battery Health %</label>
                  <div className="relative">
                    <Battery className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.batteryHealth}
                      onChange={(e) => updateFormData('batteryHealth', e.target.value)}
                      className="input pl-10"
                      min="0"
                      max="100"
                      placeholder="e.g., 96"
                    />
                  </div>
                </div>

                {/* iOS Version */}
                {['IPHONE', 'IPAD'].includes(listing.deviceType) && (
                  <div>
                    <label className="label mb-2 block">iOS Version</label>
                    <input
                      type="text"
                      value={formData.osVersion}
                      onChange={(e) => updateFormData('osVersion', e.target.value)}
                      className="input"
                      placeholder="e.g., 16.1.2"
                    />
                  </div>
                )}

                {/* Carrier */}
                {['IPHONE', 'IPAD'].includes(listing.deviceType) && (
                  <div>
                    <label className="label mb-2 block">Carrier</label>
                    <select
                      value={formData.carrier}
                      onChange={(e) => updateFormData('carrier', e.target.value)}
                      className="input"
                    >
                      <option value="">Select</option>
                      {carriers.map((carrier) => (
                        <option key={carrier} value={carrier}>{carrier}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Jailbreak Status */}
                {['IPHONE', 'IPAD'].includes(listing.deviceType) && (
                  <div className="sm:col-span-2">
                    <label className="label mb-2 block">Jailbreak Status</label>
                    <div className="flex flex-wrap gap-2">
                      {jailbreakStatuses.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => updateFormData('jailbreakStatus', status.value)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            formData.jailbreakStatus === status.value
                              ? 'border-primary-500 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.originalParts}
                      onChange={(e) => updateFormData('originalParts', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600"
                    />
                    <span className="text-sm">All Original Parts</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Photos</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {/* Existing images */}
                {images.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
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

                {/* New images */}
                {newImages.map((url, index) => (
                  <div key={`new-${index}`} className="relative aspect-square">
                    <img
                      src={url}
                      alt={`New photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                      New
                    </span>
                  </div>
                ))}

                {/* Upload button */}
                {images.length + newImages.length < 10 && (
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

              <p className="text-sm text-gray-500 mt-3">
                {images.length + newImages.length}/10 photos. The first photo is your cover image.
              </p>
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3">
              <Link href={`/listings/${id}`} className="btn-secondary">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRejected || needsInfo ? 'Resubmitting...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isRejected || needsInfo ? 'Save & Resubmit for Review' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
