'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export type SubscriptionTier = 'FREE' | 'PLUS' | 'PRO'

const SIMULATION_KEY = 'admin-tier-simulation'

export function useSubscriptionTier() {
  const { data: session } = useSession()
  const [simulatedTier, setSimulatedTier] = useState<SubscriptionTier | null>(null)
  const [mounted, setMounted] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'
  const actualTier = (session?.user?.subscriptionTier as SubscriptionTier) || 'FREE'

  useEffect(() => {
    setMounted(true)
    if (isAdmin) {
      const stored = localStorage.getItem(SIMULATION_KEY) as SubscriptionTier | null
      if (stored && ['FREE', 'PLUS', 'PRO'].includes(stored)) {
        setSimulatedTier(stored)
      }
    }
  }, [isAdmin])

  const setSimulation = (tier: SubscriptionTier | null) => {
    if (!isAdmin) return

    if (tier) {
      localStorage.setItem(SIMULATION_KEY, tier)
      setSimulatedTier(tier)
    } else {
      localStorage.removeItem(SIMULATION_KEY)
      setSimulatedTier(null)
    }
  }

  const clearSimulation = () => setSimulation(null)

  // Return simulated tier if admin with active simulation, otherwise actual tier
  const effectiveTier = (isAdmin && simulatedTier) ? simulatedTier : actualTier
  const isSimulating = isAdmin && simulatedTier !== null

  return {
    tier: effectiveTier,
    actualTier,
    simulatedTier,
    isSimulating,
    isAdmin,
    setSimulation,
    clearSimulation,
    mounted,
  }
}
