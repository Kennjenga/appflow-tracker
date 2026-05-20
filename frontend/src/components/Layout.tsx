import React from 'react'
import { Link, useMatches } from '@tanstack/react-router'
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
  { label: 'All Tasks', icon: ClipboardList, href: '/' },
  { label: 'Drafts', icon: FilePenLine, href: '/' },
  { label: 'Pending Review', icon: Clock, href: '/' },
  { label: 'Completed', icon: CheckCircle2, href: '/' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname ?? '/'

  return (
    <div className="app-layout">
      {/* Top Nav Bar */}
      <header className="topnav">
        <div className="topnav__left">
          <span className="topnav__brand">WorkflowStream</span>
          <nav className="topnav__links">
            <Link
              to="/"
              className={`topnav__link ${currentPath === '/' ? 'topnav__link--active' : ''}`}
            >
              Dashboard
            </Link>
            <span className="topnav__link">Workflows</span>
          </nav>
        </div>

        <div className="topnav__right">
          <div className="topnav__search">
            <Search size={16} aria-hidden="true" className="topnav__search-icon" />
            <input placeholder="Search applications..." type="text" />
          </div>
          <button className="topnav__icon-btn" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className="topnav__icon-btn" aria-label="Help">
            <HelpCircle size={20} />
          </button>
          <div className="topnav__avatar">U</div>
        </div>
      </header>

      {/* Side Nav Bar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h2 className="sidebar__brand-title">Task Manager</h2>
            <p className="sidebar__brand-sub">Enterprise-Lite Tracking</p>
          </div>
        </div>

        <Link to="/applications/new" className="sidebar__cta">
          <Plus size={18} />
          Create New Task
        </Link>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = idx === 0 && currentPath === '/'
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="layout-main">{children}</main>
    </div>
  )
}
