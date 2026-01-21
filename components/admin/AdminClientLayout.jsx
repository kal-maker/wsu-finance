'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { cn } from '@/lib/utils'

export default function AdminClientLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile devices and auto-close sidebar
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => {
            window.removeEventListener('resize', checkMobile)
        }
    }, [])

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const closeSidebar = () => {
        setSidebarOpen(false)
    }

    // Auto-close sidebar when route changes on mobile
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false)
        }
    }, [children, isMobile])

    return (
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
                    "md:ml-20 lg:ml-64", // Match the original layout margins
                    sidebarOpen && isMobile && "overflow-hidden"
                )}>
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Backdrop when sidebar is open on mobile */}
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
    )
}
