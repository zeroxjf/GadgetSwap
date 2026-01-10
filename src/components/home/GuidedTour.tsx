'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  content: string
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="ios-search"]',
    title: 'Search by iOS Version',
    content: 'Find devices running specific iOS versions - perfect for jailbreaking or finding compatible devices.',
  },
  {
    target: '[data-tour="categories"]',
    title: 'Browse by Device',
    content: 'Quickly jump to iPhones, iPads, MacBooks, or Apple Watches.',
  },
  {
    target: '[data-tour="alerts"]',
    title: 'Never Miss a Device',
    content: 'Set up alerts to get notified instantly when someone lists a device matching your exact specs.',
  },
  {
    target: '[data-tour="fees"]',
    title: 'Industry-Low Fees',
    content: 'Just 1% platform fee (+ Stripe processing). Go Plus or Pro for 0% fees!',
  },
  {
    target: '[data-tour="listings"]',
    title: 'Featured Listings',
    content: 'Each listing shows iOS version and jailbreak status prominently so you know exactly what you\'re getting.',
  },
]

interface GuidedTourProps {
  isActive: boolean
  onComplete: () => void
}

export function GuidedTour({ isActive, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const highlightRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  // Lock body scroll when tour is active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isActive])

  const scrollToAndHighlight = useCallback((stepIndex: number) => {
    const step = tourSteps[stepIndex]
    if (!step) return

    const element = document.querySelector(step.target) as HTMLElement
    if (!element) return

    setIsReady(false)

    // Scroll element into center of viewport
    const rect = element.getBoundingClientRect()
    const elementTop = rect.top + window.scrollY
    const viewportHeight = window.innerHeight
    const targetScroll = elementTop - (viewportHeight / 2) + (rect.height / 2)

    // Temporarily enable scrolling for programmatic scroll
    document.body.style.overflow = ''

    window.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    })

    // Re-lock scroll and position elements after scroll completes
    setTimeout(() => {
      document.body.style.overflow = 'hidden'
      positionElements(element)
      setIsReady(true)
    }, 400)
  }, [])

  const positionElements = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()

    // Position highlight
    if (highlightRef.current) {
      highlightRef.current.style.top = `${rect.top - 8}px`
      highlightRef.current.style.left = `${rect.left - 8}px`
      highlightRef.current.style.width = `${rect.width + 16}px`
      highlightRef.current.style.height = `${rect.height + 16}px`
    }

    // Position tooltip below or above element
    if (tooltipRef.current) {
      const tooltipHeight = 220
      const tooltipWidth = 340
      const padding = 20

      let top: number
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2)

      // Check if there's room below
      if (rect.bottom + padding + tooltipHeight < window.innerHeight) {
        top = rect.bottom + padding
      } else {
        // Place above
        top = rect.top - tooltipHeight - padding
      }

      // Keep in viewport horizontally
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
      top = Math.max(16, top)

      tooltipRef.current.style.top = `${top}px`
      tooltipRef.current.style.left = `${left}px`
    }
  }

  useEffect(() => {
    if (isActive) {
      scrollToAndHighlight(currentStep)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isActive, currentStep, scrollToAndHighlight])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    document.body.style.overflow = ''
    localStorage.setItem('guidedTourCompleted', 'true')
    onComplete()
  }

  if (!isActive) return null

  const step = tourSteps[currentStep]

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 transition-opacity duration-300"
        onClick={handleComplete}
      />

      {/* Highlight box */}
      <div
        ref={highlightRef}
        className={`fixed z-[101] rounded-xl border-4 border-primary-500 bg-white/10 backdrop-blur-[1px] transition-all duration-300 pointer-events-none ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.4)'
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[102] w-[340px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 transition-all duration-300 ${
          isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <button
            onClick={handleComplete}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {step.content}
        </p>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleComplete}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors"
            >
              {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < tourSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
