'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  X,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

const navigation = [
  {
    name: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
  },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    // Close sidebar on mobile when link is clicked
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Positioned for full height stickiness (z-40 to sit behind z-50 header) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-20 lg:w-64 bg-gradient-to-b from-navy-800 to-navy-900 border-r border-navy-700/50 transform transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden shadow-2xl pt-16",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Header Section */}
        <div className="flex items-center justify-center lg:justify-between p-4 lg:p-6 border-b border-navy-700/50">


          {/* Close Button - Only show when expanded or on specific breakpoints if needed */}
          {/* For now, we rely on backdrop and links to close on mobile */}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border-r-2 border-cyan-400 shadow-lg shadow-cyan-500/10"
                    : "text-navy-100 hover:text-white hover:bg-navy-700/50 hover:shadow-lg hover:shadow-cyan-500/5",
                  "justify-center lg:justify-start"
                )}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-cyan-500/10 rounded-lg" />
                )}

                <item.icon className={cn(
                  "h-4 w-4 transition-transform duration-200 z-10",
                  isActive && "scale-110 text-cyan-300",
                  !isActive && "text-navy-300 group-hover:text-cyan-300"
                )} />
                <span className="z-10 hidden lg:block">{item.name}</span>

                {/* Hover effect */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/5 opacity-0 transition-opacity duration-200",
                  !isActive && "group-hover:opacity-100"
                )} />
              </Link>
            )
          })}
        </nav>

        {/* Footer Section - Stick to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 border-t border-navy-700/50 bg-navy-900">
          <div className="text-center">
            <div className="lg:block hidden">
              <p className="text-sm font-semibold text-white">WSU Finance</p>
              <p className="text-xs text-navy-400 mt-1">Administration System</p>
            </div>

            <div className="flex flex-col items-center lg:flex-row lg:justify-center lg:space-x-2 lg:mt-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse lg:mb-0 mb-1"></div>
              <p className="text-[10px] lg:text-xs text-navy-500 whitespace-nowrap">
                {pathname === '/admin' ? 'Online' : 'Live'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Mobile Menu Button Component
export function AdminMobileMenu({ onToggle }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="lg:hidden p-2 hover:bg-navy-700/50 text-white"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}