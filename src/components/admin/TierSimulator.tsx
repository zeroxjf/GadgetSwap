'use client'

import { useSubscriptionTier, SubscriptionTier } from '@/hooks/useSubscriptionTier'
import { Eye, EyeOff } from 'lucide-react'

const tiers: { value: SubscriptionTier; label: string; color: string }[] = [
  { value: 'FREE', label: 'Free', color: 'bg-gray-500' },
  { value: 'PLUS', label: 'Plus', color: 'bg-blue-500' },
  { value: 'PRO', label: 'Pro', color: 'bg-purple-500' },
]

export function TierSimulator() {
  const { tier, actualTier, isSimulating, setSimulation, clearSimulation, mounted } = useSubscriptionTier()

  if (!mounted) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">View Site As</h3>
        </div>
        {isSimulating && (
          <button
            onClick={clearSimulation}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <EyeOff className="w-3 h-3" />
            Stop Simulating
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {tiers.map((t) => (
          <button
            key={t.value}
            onClick={() => setSimulation(t.value === actualTier ? null : t.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tier === t.value
                ? `${t.color} text-white`
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.label}
            {t.value === actualTier && !isSimulating && (
              <span className="ml-1 text-xs opacity-75">(You)</span>
            )}
          </button>
        ))}
      </div>

      {isSimulating && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Simulating {tier} tier. Browse the site to see what {tier} users see.
        </p>
      )}
    </div>
  )
}
