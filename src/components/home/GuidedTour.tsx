'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const tourSteps = [
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
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const previousElementRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!isActive) return

    const step = tourSteps[currentStep]
    const element = document.querySelector(step.target)

    // Remove highlight from previous element
    if (previousElementRef.current) {
      previousElementRef.current.classList.remove('tour-highlight')
    }

    if (element) {
      // Add highlight to current element
      element.classList.add('tour-highlight')
      previousElementRef.current = element

      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Position tooltip after scroll
      setTimeout(() => {
        const rect = element.getBoundingClientRect()
        const tooltipWidth = 340
        const tooltipHeight = 200

        let top = rect.bottom + 16
        let left = rect.left + (rect.width / 2) - (tooltipWidth / 2)

        // If not enough room below, put above
        if (top + tooltipHeight > window.innerHeight - 20) {
          top = rect.top - tooltipHeight - 16
        }

        // Keep in viewport
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
        top = Math.max(16, top)

        setTooltipPos({ top, left })
      }, 400)
    }

    return () => {
      if (element) {
        element.classList.remove('tour-highlight')
      }
    }
  }, [isActive, currentStep])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousElementRef.current) {
        previousElementRef.current.classList.remove('tour-highlight')
      }
    }
  }, [])

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
    if (previousElementRef.current) {
      previousElementRef.current.classList.remove('tour-highlight')
    }
    localStorage.setItem('guidedTourCompleted', 'true')
    onComplete()
  }

  if (!isActive) return null

  const step = tourSteps[currentStep]

  return (
    <>
      {/* Styles for highlighted element */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 1000 !important;
          outline: 4px solid #6366f1 !important;
          outline-offset: 4px !important;
          border-radius: 12px !important;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.5) !important;
        }
      `}</style>

      {/* Tooltip */}
      <div
        className="fixed z-[1001] w-[340px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-fade-in"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        {/* Header */}
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
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
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
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
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
