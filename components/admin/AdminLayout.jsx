'use client'

import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

export function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex pt-16"> {/* Add padding top for fixed header */}
        <AdminSidebar />
        <main className="flex-1 p-6 lg:ml-64"> {/* Responsive margin */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}