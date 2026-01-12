'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Star,
  Loader2,
  X,
  User,
  Phone,
  Check,
} from 'lucide-react'
import AddressAutocomplete, { AddressComponents } from '@/components/AddressAutocomplete'

interface SavedAddress {
  id: string
  label: string | null
  name: string
  line1: string
  line2: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phone: string | null
  isDefault: boolean
}

interface AddressForm {
  name: string
  line1: string
  line2: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  label: string
  isDefault: boolean
}

const emptyForm: AddressForm = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  phone: '',
  label: '',
  isDefault: false,
}

export default function AddressesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/addresses')
    }
  }, [status, router])

  // Fetch addresses
  useEffect(() => {
    async function fetchAddresses() {
      try {
        const res = await fetch('/api/addresses')
        if (!res.ok) throw new Error('Failed to fetch addresses')
        const data = await res.json()
        setAddresses(data.addresses)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchAddresses()
    }
  }, [session])

  const openAddModal = () => {
    setEditingId(null)
    setForm({ ...emptyForm, isDefault: addresses.length === 0 })
    setShowModal(true)
  }

  const openEditModal = (address: SavedAddress) => {
    setEditingId(address.id)
    setForm({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
      label: address.label || '',
      isDefault: address.isDefault,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleAddressChange = (address: AddressComponents) => {
    setForm({
      ...form,
      ...address,
    })
  }

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.state || !form.zipCode) {
      setError('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save address')
      }

      const data = await res.json()

      if (editingId) {
        // Update existing address
        setAddresses(addresses.map(a =>
          a.id === editingId ? data.address : (form.isDefault && a.isDefault ? { ...a, isDefault: false } : a)
        ))
      } else {
        // Add new address
        if (form.isDefault) {
          setAddresses([...addresses.map(a => ({ ...a, isDefault: false })), data.address])
        } else {
          setAddresses([...addresses, data.address])
        }
      }

      closeModal()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setIsDeleting(id)

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete address')
      }

      setAddresses(addresses.filter(a => a.id !== id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (!res.ok) throw new Error('Failed to set default address')

      setAddresses(addresses.map(a => ({
        ...a,
        isDefault: a.id === id,
      })))
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
              <p className="text-gray-600">Manage your shipping addresses</p>
            </div>
            <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="card p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
            <p className="text-gray-500 mb-6">Add an address to speed up checkout</p>
            <button onClick={openAddModal} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`card p-5 transition-all ${
                  address.isDefault ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{address.name}</span>
                      {address.label && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {address.label}
                        </span>
                      )}
                      {address.isDefault && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}
                    </p>
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    {address.phone && (
                      <p className="text-gray-500 text-sm mt-1">{address.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(address)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      disabled={isDeleting === address.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting === address.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="label mb-1.5 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Address Autocomplete */}
              <div>
                <label className="label mb-1.5 block">Address *</label>
                <AddressAutocomplete
                  value={{
                    line1: form.line1,
                    line2: form.line2,
                    city: form.city,
                    state: form.state,
                    zipCode: form.zipCode,
                    country: form.country,
                  }}
                  onChange={handleAddressChange}
                  placeholder="Start typing your address..."
                />
              </div>

              {/* Phone */}
              <div>
                <label className="label mb-1.5 block">Phone (optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="input pl-10"
                  />
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="label mb-1.5 block">Label (optional)</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Home, Work, etc."
                  className="input"
                />
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-5 h-5 rounded text-primary-600"
                />
                <span className="text-gray-700">Set as default address</span>
              </label>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
              <button
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingId ? 'Save Changes' : 'Add Address'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
