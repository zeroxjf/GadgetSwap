'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="ios-search"]',
    title: 'Search by iOS Version',
    content: 'Find devices running specific iOS versions - perfect for jailbreaking or finding compatible devices.',
    position: 'bottom',
  },
  {
    target: '[data-tour="categories"]',
    title: 'Browse by Device',
    content: 'Quickly jump to iPhones, iPads, MacBooks, or Apple Watches.',
    position: 'top',
  },
  {
    target: '[data-tour="alerts"]',
    title: 'Never Miss a Device',
    content: 'Set up alerts to get notified instantly when someone lists a device matching your exact specs.',
    position: 'bottom',
  },
  {
    target: '[data-tour="fees"]',
    title: 'Industry-Low Fees',
    content: 'Just 1% platform fee (+ Stripe processing). Go Plus or Pro for 0% fees!',
    position: 'top',
  },
  {
    target: '[data-tour="listings"]',
    title: 'Featured Listings',
    content: 'Each listing shows iOS version and jailbreak status prominently so you know exactly what you\'re getting.',
    position: 'top',
  },
]

interface GuidedTourProps {
  isActive: boolean
  onComplete: () => void
}

export function GuidedTour({ isActive, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const updateTargetPosition = useCallback(() => {
    const step = tourSteps[currentStep]
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)

      // Scroll element into view if needed
      const elementTop = rect.top + window.scrollY
      const elementBottom = elementTop + rect.height
      const viewportTop = window.scrollY
      const viewportBottom = viewportTop + window.innerHeight

      if (elementTop < viewportTop + 100 || elementBottom > viewportBottom - 100) {
        window.scrollTo({
          top: elementTop - 150,
          behavior: 'smooth',
        })
      }
    }
  }, [currentStep])

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
      updateTargetPosition()

      // Update position on scroll/resize
      window.addEventListener('scroll', updateTargetPosition)
      window.addEventListener('resize', updateTargetPosition)

      return () => {
        window.removeEventListener('scroll', updateTargetPosition)
        window.removeEventListener('resize', updateTargetPosition)
      }
    }
  }, [isActive, updateTargetPosition])

  useEffect(() => {
    if (isActive) {
      updateTargetPosition()
    }
  }, [currentStep, isActive, updateTargetPosition])

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
    setIsVisible(false)
    localStorage.setItem('guidedTourCompleted', 'true')
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isActive || !isVisible) return null

  const step = tourSteps[currentStep]

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) return { opacity: 0 }

    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 180

    let top = 0
    let left = 0

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding + window.scrollY
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'top':
        top = targetRect.top - tooltipHeight - padding + window.scrollY
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2) + window.scrollY
        left = targetRect.left - tooltipWidth - padding
        break
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2) + window.scrollY
        left = targetRect.right + padding
        break
    }

    // Keep tooltip in viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))

    return {
      position: 'absolute' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  }

  // Calculate highlight style
  const getHighlightStyle = () => {
    if (!targetRect) return { opacity: 0 }

    return {
      position: 'absolute' as const,
      top: `${targetRect.top + window.scrollY - 8}px`,
      left: `${targetRect.left - 8}px`,
      width: `${targetRect.width + 16}px`,
      height: `${targetRect.height + 16}px`,
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {/* Semi-transparent background */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Highlight cutout */}
        {targetRect && (
          <div
            className="absolute rounded-xl ring-4 ring-primary-500 ring-offset-2 bg-transparent z-[61]"
            style={getHighlightStyle()}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="z-[70] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 pointer-events-auto"
        style={getTooltipStyle()}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {step.content}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep
                  ? 'bg-primary-500'
                  : i < currentStep
                  ? 'bg-primary-300'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < tourSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
