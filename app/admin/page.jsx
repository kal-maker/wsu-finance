import QuickStats from '../../components/admin/dashboard/QuickStats'
import SystemOverview from '../../components/admin/dashboard/SystemOverview'
import RecentActivity from '../../components/admin/dashboard/RecentActivity'
import SystemStatus from '../../components/admin/dashboard/SystemStatus'
import AdminAccess from '@/components/admin/AdminAccess'
export default function AdminDashboard() {
  return (
      <AdminAccess showAdminHeader={true}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-text-gradient bg-clip-text text-transparent">
            System Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor your financial management system performance and user activities
          </p>
        </div>
      </div>

      {/* System Status at the top for immediate health monitoring */}
      <SystemStatus />
      
      <QuickStats />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SystemOverview />
        </div>
        <div className="xl:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
       </AdminAccess>
  )
}