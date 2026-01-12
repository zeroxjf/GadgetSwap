'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  CheckCircle,
  Bug,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Flag,
  AlertTriangle,
} from 'lucide-react'

type TicketType = 'bug' | 'feedback' | 'question' | 'other'
type Priority = 'low' | 'normal' | 'high' | 'urgent'

export function FeedbackWidget() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<TicketType>('feedback')
  const [priority, setPriority] = useState<Priority>('normal')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showAttention, setShowAttention] = useState(false)

  // Listen for attention trigger from welcome banner
  useEffect(() => {
    const handleShowAttention = () => {
      setShowAttention(true)
      // Stop animation after 5 seconds
      setTimeout(() => {
        setShowAttention(false)
      }, 5000)
    }

    window.addEventListener('showFeedbackAttention', handleShowAttention)
    return () => {
      window.removeEventListener('showFeedbackAttention', handleShowAttention)
    }
  }, [])

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (message.trim().length < 10) {
      setError('Please write at least 10 characters')
      return
    }

    if (!session?.user && !email) {
      setError('Please provide your email')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          priority,
          message: message.trim(),
          email: session?.user?.email || email,
          pageUrl: window.location.href,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setSubmitted(true)
      setMessage('')
      setEmail('')
      setPriority('normal')

      // Auto close after 3 seconds
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const typeOptions = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
    { value: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'text-blue-500' },
    { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-purple-500' },
    { value: 'other', label: 'Other', icon: MessageCircle, color: 'text-gray-500' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'border-gray-300 bg-gray-50 text-gray-600', activeColor: 'border-gray-500 bg-gray-500 text-white' },
    { value: 'normal', label: 'Normal', color: 'border-blue-300 bg-blue-50 text-blue-600', activeColor: 'border-blue-500 bg-blue-500 text-white' },
    { value: 'high', label: 'High', icon: Flag, color: 'border-orange-300 bg-orange-50 text-orange-600', activeColor: 'border-orange-500 bg-orange-500 text-white' },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'border-red-300 bg-red-50 text-red-600', activeColor: 'border-red-500 bg-red-500 text-white' },
  ]

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed bottom-6 right-6 z-40 ${isOpen ? 'hidden' : ''}`}>
        {/* Attention Tooltip */}
        {showAttention && (
          <div className="absolute bottom-full right-0 mb-3 animate-fade-in">
            <div className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
              Questions or concerns?
              <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
            </div>
          </div>
        )}
        <button
          onClick={() => {
            setIsOpen(true)
            setShowAttention(false)
          }}
          className={`bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
            showAttention ? 'animate-dock-bounce' : ''
          }`}
          aria-label="Send feedback"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Widget Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-semibold">Send us feedback</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/80 mt-1">
              We're a brand new site! Help us improve by reporting bugs or sharing ideas.
            </p>
          </div>

          {/* Content */}
          <div className="p-4">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Thank you!
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We'll review your feedback and address it promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What's this about?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value as TicketType)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          type === opt.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <opt.icon className={`w-4 h-4 ${type === opt.value ? 'text-primary-500' : opt.color}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-1">
                    {priorityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value as Priority)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          priority === opt.value
                            ? opt.activeColor
                            : `${opt.color} hover:opacity-80`
                        }`}
                      >
                        {opt.icon && <opt.icon className="w-3 h-3" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email (if not logged in) */}
                {!session?.user && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {type === 'bug' ? 'Describe the issue' : 'Your message'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === 'bug'
                        ? 'What happened? What did you expect to happen?'
                        : 'Share your thoughts, ideas, or questions...'
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {message.length}/500 characters
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || message.length < 10}
                  className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-medium py-2.5 rounded-lg hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                  Your feedback helps us build a better platform!
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
