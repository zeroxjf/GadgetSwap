import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Shield,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Home,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Mail,
  Activity,
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/reviews')
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  })

  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    redirect('/')
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/activity', icon: Activity, label: 'Activity & Traffic' },
    { href: '/admin/reviews', icon: ClipboardList, label: 'Review Queue' },
    { href: '/admin/messages', icon: AlertTriangle, label: 'Flagged Messages' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/transactions', icon: CreditCard, label: 'Transactions' },
    { href: '/admin/email', icon: Mail, label: 'Email Users' },
    { href: '/admin/support', icon: MessageSquare, label: 'Support' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Logged in as {user?.name || session.user.email}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Site</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
