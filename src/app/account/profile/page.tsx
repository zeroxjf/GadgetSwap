'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  User,
  ChevronLeft,
  Camera,
  Save,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'

export default function EditProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/profile')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        username: (session.user as any).username || '',
        bio: '',
        location: '',
      })
      setProfileImage(session.user.image || null)
      // Fetch full profile
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const user = data.user
        setFormData({
          name: user.name || '',
          username: user.username || '',
          bio: user.bio || '',
          location: user.location || '',
        })
        if (user.image) {
          setProfileImage(user.image)
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      await update() // Refresh session
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Use JPEG, PNG, WebP, or GIF.' })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image too large. Maximum size is 5MB.' })
      return
    }

    setUploadingPhoto(true)
    setMessage(null)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        const response = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload photo')
        }

        setProfileImage(data.image)
        setMessage({ type: 'success', text: 'Profile photo updated!' })
        await update() // Refresh session
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload photo',
      })
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    const confirmed = confirm('Are you sure you want to remove your profile photo?')
    if (!confirmed) return

    setUploadingPhoto(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove photo')
      }

      setProfileImage(null)
      setMessage({ type: 'success', text: 'Profile photo removed.' })
      await update() // Refresh session
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove photo' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your personal information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                  {uploadingPhoto ? (
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  ) : profileImage ? (
                    <img src={profileImage} alt="" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary-600" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Upload a profile picture. Recommended size is 400x400 pixels.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="btn-secondary text-sm inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {profileImage ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="btn text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label mb-1 block">Display Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="username" className="label mb-1 block">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="input pl-8"
                    placeholder="username"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only lowercase letters, numbers, and underscores
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="label mb-1 block">Bio</label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div>
                <label htmlFor="location" className="label mb-1 block">Location</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder="City, State"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/account" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
