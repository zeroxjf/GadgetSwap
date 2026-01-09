'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Star,
  Package,
  ShoppingBag,
  Bell,
  Settings,
  Shield,
  ChevronRight,
  Edit2,
  Camera
} from 'lucide-react'

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account')
    }
  }, [status, router])

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

  const user = session.user

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Manage your profile, listings, and settings</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="card p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <span className="text-primary-600 font-bold text-3xl">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <h2 className="text-xl font-semibold mt-4">{user.name || 'User'}</h2>
                <p className="text-gray-500 text-sm">@{(user as any).username || user.email?.split('@')[0]}</p>

                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{(user as any).rating || '0.0'}</span>
                  <span className="text-gray-400 text-sm">(0 reviews)</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="card p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <p className="font-semibold">{(user as any).subscriptionTier || 'Free'}</p>
                </div>
                <Link href="/subscription" className="btn-secondary text-sm">
                  Upgrade
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <Package className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Active Listings</p>
              </div>
              <div className="card p-4 text-center">
                <ShoppingBag className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{(user as any).totalSales || 0}</p>
                <p className="text-sm text-gray-500">Total Sales</p>
              </div>
              <div className="card p-4 text-center">
                <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Purchases</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="card divide-y divide-gray-100">
              <Link href="/account/profile" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">Edit Profile</p>
                    <p className="text-sm text-gray-500">Update your personal information</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link href="/account/listings" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">My Listings</p>
                    <p className="text-sm text-gray-500">Manage your active and sold listings</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link href="/account/purchases" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Purchase History</p>
                    <p className="text-sm text-gray-500">View your past purchases</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link href="/alerts" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Bell className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Device Alerts</p>
                    <p className="text-sm text-gray-500">Manage your saved search alerts</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link href="/account/settings" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Account Settings</p>
                    <p className="text-sm text-gray-500">Password, email, and security</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              <Link href="/account/security" className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Security</p>
                    <p className="text-sm text-gray-500">Two-factor authentication and sessions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
              <Link href="/listings/new" className="btn-primary flex-1 justify-center">
                Create New Listing
              </Link>
              <Link href="/messages" className="btn-secondary flex-1 justify-center">
                View Messages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
