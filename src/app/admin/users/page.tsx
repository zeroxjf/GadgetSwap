'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldX,
  User,
  Mail,
  Calendar,
  ShoppingBag,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  Crown,
  Trash2,
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  username: string | null
  image: string | null
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  subscriptionTier: string
  totalSales: number
  totalPurchases: number
  rating: number
  ratingCount: number
  createdAt: string
  stripeOnboardingComplete: boolean
  _count: {
    listings: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(tierFilter !== 'all' && { tier: tierFilter }),
      })

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()

      if (res.ok) {
        setUsers(data.users)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, tierFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1)
      fetchUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      }
    } catch (error) {
      console.error('Failed to update role:', error)
    } finally {
      setActionLoading(null)
      setActionMenuOpen(null)
    }
  }

  const handleTierChange = async (userId: string, newTier: 'FREE' | 'PLUS' | 'PRO') => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionTier: newTier }),
      })

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, subscriptionTier: newTier } : u))
        )
      }
    } catch (error) {
      console.error('Failed to update tier:', error)
    } finally {
      setActionLoading(null)
      setActionMenuOpen(null)
    }
  }

  const handleBanUser = async (userId: string, banned: boolean) => {
    if (banned && !confirm('Are you sure you want to ban this user?')) return

    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned }),
      })

      if (res.ok) {
        fetchUsers() // Refresh to show updated status
      }
    } catch (error) {
      console.error('Failed to ban user:', error)
    } finally {
      setActionLoading(null)
      setActionMenuOpen(null)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userName}? This will delete all their listings, messages, and transactions. This cannot be undone.`)) return

    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        setTotal((prev) => prev - 1)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setActionLoading(null)
      setActionMenuOpen(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded">
            <Crown className="w-3 h-3" /> Admin
          </span>
        )
      case 'MODERATOR':
        return (
          <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3" /> Mod
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
            <User className="w-3 h-3" /> User
          </span>
        )
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PRO':
        return <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded">Pro</span>
      case 'PLUS':
        return <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">Plus</span>
      default:
        return <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">Free</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Roles</option>
          <option value="USER">Users</option>
          <option value="MODERATOR">Moderators</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Tiers</option>
          <option value="FREE">Free</option>
          <option value="PLUS">Plus</option>
          <option value="PRO">Pro</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role / Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name || user.username || 'Unnamed'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      {getTierBadge(user.subscriptionTier)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          {user.totalSales} sales
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {user.rating.toFixed(1)} ({user.ratingCount})
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {user._count.listings} listings
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {actionMenuOpen === user.id && (
                        <div className={`absolute right-0 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 ${index >= users.length - 3 ? 'bottom-full mb-2' : 'mt-2'}`}>
                          <div className="py-1">
                            {/* Subscription Tier */}
                            <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                              Subscription Tier
                            </div>
                            <button
                              onClick={() => handleTierChange(user.id, 'FREE')}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${user.subscriptionTier === 'FREE' ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            >
                              <User className="w-4 h-4 text-gray-500" /> Free
                              {user.subscriptionTier === 'FREE' && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                            </button>
                            <button
                              onClick={() => handleTierChange(user.id, 'PLUS')}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${user.subscriptionTier === 'PLUS' ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            >
                              <Crown className="w-4 h-4 text-blue-500" /> Plus
                              {user.subscriptionTier === 'PLUS' && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                            </button>
                            <button
                              onClick={() => handleTierChange(user.id, 'PRO')}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${user.subscriptionTier === 'PRO' ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            >
                              <Crown className="w-4 h-4 text-purple-500" /> Pro (Lifetime)
                              {user.subscriptionTier === 'PRO' && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                            </button>

                            <hr className="my-1 border-gray-200 dark:border-gray-700" />

                            {/* Role */}
                            <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase">
                              Admin Role
                            </div>
                            <button
                              onClick={() => handleRoleChange(user.id, 'USER')}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${user.role === 'USER' ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            >
                              <User className="w-4 h-4" /> User
                              {user.role === 'USER' && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, 'MODERATOR')}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${user.role === 'MODERATOR' ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            >
                              <ShieldCheck className="w-4 h-4" /> Moderator
                              {user.role === 'MODERATOR' && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, 'ADMIN')}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${user.role === 'ADMIN' ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                            >
                              <Shield className="w-4 h-4" /> Admin
                              {user.role === 'ADMIN' && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
                            </button>

                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button
                              onClick={() => handleBanUser(user.id, true)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Ban className="w-4 h-4" /> Ban User
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
