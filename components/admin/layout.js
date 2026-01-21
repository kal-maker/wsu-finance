'use client'  

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminAccess from '@/components/admin/AdminAccess'

// Add this helper function if not already in your utils
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile devices and auto-close sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const toggleSidebar = () => {
    console.log('Toggle sidebar called, current state:', sidebarOpen)
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    console.log('Close sidebar called')
    setSidebarOpen(false)
  }

  // Auto-close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [children?.props, isMobile]) // Close when children change (route change)

  return (
    <AdminAccess>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-navy-50">
        <AdminHeader onToggleSidebar={toggleSidebar} />
        
        <div className="flex pt-16">
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar} 
          />
          
          {/* Main Content Area */}
          <main className={cn(
            "flex-1 min-h-[calc(100vh-4rem)] p-4 lg:p-6 transition-all duration-300",
            "lg:ml-64", // Only apply margin on large screens when sidebar is present
            sidebarOpen && isMobile && "overflow-hidden" // Prevent scrolling when sidebar is open on mobile
          )}>
            <div className="max-w-7xl mx-auto w-full">
              {/* Optional: Add a subtle backdrop when sidebar is open on mobile */}
              {sidebarOpen && isMobile && (
                <div 
                  className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                  onClick={closeSidebar}
                />
              )}
              
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminAccess>
  )
}