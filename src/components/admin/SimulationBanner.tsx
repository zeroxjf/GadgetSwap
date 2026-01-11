'use client'

import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'
import { Eye, X } from 'lucide-react'

export function SimulationBanner() {
  const { tier, isSimulating, clearSimulation, mounted } = useSubscriptionTier()

  if (!mounted || !isSimulating) return null

  const tierColors = {
    FREE: 'bg-gray-600',
    PLUS: 'bg-blue-600',
    PRO: 'bg-purple-600',
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] ${tierColors[tier]} text-white py-1.5 px-4 text-center text-sm font-medium`}>
      <div className="flex items-center justify-center gap-2">
        <Eye className="w-4 h-4" />
        <span>Viewing as {tier} user</span>
        <button
          onClick={clearSimulation}
          className="ml-2 p-0.5 hover:bg-white/20 rounded"
          title="Stop simulating"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
