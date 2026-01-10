'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateTargetPosition = useCallback(() => {
    const step = tourSteps[currentStep]
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
    }
  }, [currentStep])

  const scrollToElement = useCallback(() => {
    const step = tourSteps[currentStep]
    if (!step) return

    const element = document.querySelector(step.target)
    if (element) {
      setIsScrolling(true)

      const rect = element.getBoundingClientRect()
      const elementTop = rect.top + window.scrollY
      const viewportHeight = window.innerHeight
      const targetScroll = elementTop - (viewportHeight / 2) + (rect.height / 2)

      window.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      })

      // Wait for scroll to finish before showing highlight
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
        updateTargetPosition()
      }, 500)
    }
  }, [currentStep, updateTargetPosition])

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
      scrollToElement()

      // Update position on scroll
      const handleScroll = () => {
        if (!isScrolling) {
          updateTargetPosition()
        }
      }

      const handleResize = () => {
        updateTargetPosition()
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }
  }, [isActive, scrollToElement, updateTargetPosition, isScrolling])

  useEffect(() => {
    if (isActive && isVisible) {
      scrollToElement()
    }
  }, [currentStep, isActive, isVisible, scrollToElement])

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

  // Calculate tooltip position (fixed positioning relative to viewport)
  const getTooltipStyle = () => {
    if (!targetRect) return { opacity: 0 }

    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 200

    let top = 0
    let left = 0

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'top':
        top = targetRect.top - tooltipHeight - padding
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)
        left = targetRect.left - tooltipWidth - padding
        break
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)
        left = targetRect.right + padding
        break
    }

    // Keep tooltip in viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding))

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  }

  // Calculate highlight style (fixed positioning)
  const getHighlightStyle = () => {
    if (!targetRect) return { opacity: 0 }

    return {
      position: 'fixed' as const,
      top: `${targetRect.top - 8}px`,
      left: `${targetRect.left - 8}px`,
      width: `${targetRect.width + 16}px`,
      height: `${targetRect.height + 16}px`,
    }
  }

  return (
    <>
      {/* Overlay with hole for highlighted element */}
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

        {/* Highlight box */}
        {targetRect && !isScrolling && (
          <div
            className="rounded-xl ring-4 ring-primary-500 ring-offset-4 ring-offset-transparent bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300"
            style={getHighlightStyle()}
          />
        )}
      </div>

      {/* Tooltip */}
      {!isScrolling && (
        <div
          className="fixed z-[70] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 pointer-events-auto transition-all duration-300"
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
      )}
    </>
  )
}
