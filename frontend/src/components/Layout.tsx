import React from 'react'
import { Link, useMatches, useSearch } from '@tanstack/react-router'
import {
  ClipboardList,
  FilePenLine,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Bell,
  HelpCircle,
  LayoutGrid,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'All Tasks', icon: ClipboardList, href: '/', status: undefined },
  { label: 'Drafts', icon: FilePenLine, href: '/', status: 'Draft' },
  { label: 'Pending Review', icon: Clock, href: '/', status: 'Pending' },
  { label: 'Completed', icon: CheckCircle2, href: '/', status: 'Completed' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname ?? '/'
  const search = useSearch({ strict: false }) as { status?: string }
  const currentStatus = search.status

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 bg-background border-b border-outline-variant">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-primary tracking-tight whitespace-nowrap">
            AppFlow
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-semibold px-2 py-1 rounded transition-colors ${
                currentPath === '/'
                  ? 'text-primary border-b-2 border-primary pb-0.5 rounded-none hover:bg-transparent'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex relative items-center">
            <Search size={16} aria-hidden="true" className="absolute left-3 text-outline pointer-events-none" />
            <input
              placeholder="Search applications..."
              type="text"
              className="w-60 pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold shrink-0">
            U
          </div>
        </div>
      </header>

      {/* Side Nav Bar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 pt-20 px-4 pb-4 bg-surface-container-low border-r border-outline-variant z-40 overflow-y-auto">
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-primary leading-tight">
              Task Manager
            </h2>
            <p className="text-xs text-on-surface-variant opacity-70 mt-0.5">
              Enterprise-Lite Tracking
            </p>
          </div>
        </div>

        <Link
          to="/applications/new"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 mb-5 bg-primary text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90 active:scale-[0.97]"
        >
          <Plus size={18} />
          Create New Task
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === '/' && currentStatus === item.status
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.href}
                search={{ status: item.status }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97] ${
                  isActive
                    ? 'bg-secondary-container text-primary font-bold hover:bg-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pt-22 px-6 pb-12 min-h-screen lg:ml-64">{children}</main>
    </div>
  )
}
