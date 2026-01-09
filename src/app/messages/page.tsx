'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send, Search, MoreVertical, Image as ImageIcon, ChevronLeft, MessageSquare, Loader2 } from 'lucide-react'

interface Conversation {
  id: string
  otherUser: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  listing: {
    id: string
    title: string
    price: number
    images: { url: string }[]
  } | null
  lastMessage: {
    content: string
    timestamp: string
    isRead: boolean
    fromMe: boolean
  }
  unreadCount: number
}

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/messages')
    }
  }, [status, router])

  // Fetch conversations
  useEffect(() => {
    if (session?.user) {
      fetchConversations()
    }
  }, [session])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages')
      const data = await response.json()
      if (response.ok) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentConversation = conversations.find((c) => c.id === selectedConversation)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentConversation) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: currentConversation.otherUser.id,
          content: newMessage.trim(),
          listingId: currentConversation.listing?.id,
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-[calc(100vh-64px)]">
          {/* Conversations sidebar */}
          <div
            className={`w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col ${
              selectedConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold mb-3">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 py-2"
                />
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm mt-1">
                    Start a conversation by messaging a seller on a listing
                  </p>
                  <Link href="/search" className="btn-primary mt-4 inline-block">
                    Browse Listings
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations
                    .filter((c) =>
                      searchQuery
                        ? c.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.listing?.title.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {conversation.otherUser.image ? (
                              <img
                                src={conversation.otherUser.image}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500 font-medium">
                                  {(conversation.otherUser.name || conversation.otherUser.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {conversation.otherUser.name || conversation.otherUser.username || 'User'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate mb-1">
                              {conversation.lastMessage.fromMe && 'You: '}
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.listing && (
                              <p className="text-xs text-gray-400 truncate">
                                Re: {conversation.listing.title}
                              </p>
                            )}
                          </div>

                          {/* Unread indicator */}
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div
            className={`flex-1 flex flex-col bg-white ${
              selectedConversation ? 'flex' : 'hidden md:flex'
            }`}
          >
            {currentConversation ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 flex-1">
                    {currentConversation.otherUser.image ? (
                      <img
                        src={currentConversation.otherUser.image}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {(currentConversation.otherUser.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/users/${currentConversation.otherUser.username || currentConversation.otherUser.id}`}
                        className="font-medium hover:text-primary-600"
                      >
                        {currentConversation.otherUser.name || currentConversation.otherUser.username || 'User'}
                      </Link>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Listing context */}
                {currentConversation.listing && (
                  <Link
                    href={`/listings/${currentConversation.listing.id}`}
                    className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 hover:bg-gray-100 transition-colors"
                  >
                    {currentConversation.listing.images?.[0]?.url ? (
                      <img
                        src={currentConversation.listing.images[0].url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {currentConversation.listing.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${currentConversation.listing.price}
                      </p>
                    </div>
                    <span className="text-xs text-primary-600 font-medium">View</span>
                  </Link>
                )}

                {/* Messages - empty state for now since we'd need separate endpoint */}
                <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Messages will appear here</p>
                </div>

                {/* Message input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-200 flex items-center gap-3"
                >
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 input"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary p-2.5 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">
                    Choose a conversation from the sidebar to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
