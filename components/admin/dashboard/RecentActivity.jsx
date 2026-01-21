'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  User,
  RefreshCw,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Shield,
  WifiOff,
  Database,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useCurrency } from '@/context/currency-context'

const ActivityIcon = ({ type, color }) => {
  const iconProps = { className: `h-4 w-4 ${getColorClasses(color)}` };

  switch (type) {
    case 'USER':
      return <User {...iconProps} />;
    case 'INCOME':
      return <ArrowUpRight {...iconProps} />;
    case 'EXPENSE':
      return <ArrowDownRight {...iconProps} />;
    case 'SYSTEM':
      return <Settings {...iconProps} />;
    case 'ACCOUNT':
      return <CreditCard {...iconProps} />;
    default:
      return <Shield {...iconProps} />;
  }
};

const getColorClasses = (color) => {
  switch (color) {
    case 'green':
      return 'text-green-500';
    case 'blue':
      return 'text-cyan-500';
    case 'orange':
      return 'text-orange-500';
    case 'purple':
      return 'text-purple-500';
    case 'red':
      return 'text-red-500';
    default:
      return 'text-navy-500';
  }
};

const getActivityBadge = (type) => {
  switch (type) {
    case 'USER_SIGNUP':
      return { label: 'User', color: 'bg-green-100 text-green-800 border-green-200' };
    case 'ACCOUNT_CREATED':
      return { label: 'Account', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'TRANSACTION':
      return { label: 'Transaction', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
    case 'SYSTEM':
      return { label: 'System', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    default:
      return { label: 'Activity', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
};

export default function RecentActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const { fmt } = useCurrency()

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching real activity data...')

      const response = await fetch('/api/admin/recent-activity?limit=8', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Real data response:', result)

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful response')
      }

      setActivities(result.activities || [])
      setStats(result.stats || null)

    } catch (err) {
      console.error('Error fetching recent activity:', err)
      setError(err.message)

      // Minimal fallback
      setActivities([
        {
          id: 'fallback-1',
          type: 'SYSTEM',
          title: 'System Online',
          description: 'Admin dashboard is running',
          timestamp: new Date().toISOString(),
          icon: 'SYSTEM',
          color: 'blue'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentActivity()

    // Optional: Refresh every 60 seconds for real-time updates
    const interval = setInterval(fetchRecentActivity, 60000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return fmt(amount);
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  if (loading) {
    return (
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-navy-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <CardTitle className="text-navy-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          Recent Activity
          {stats && (
            <Badge variant="outline" className="ml-2 border-cyan-200 text-cyan-700">
              <Database className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-cyan-200 text-cyan-700">
            {activities.length} activities
          </Badge>
          <Button
            onClick={fetchRecentActivity}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Data Load Issue</span>
            </div>
            <p className="text-amber-700 text-xs mt-1">
              {error} - Showing limited data
            </p>
            <Button
              onClick={fetchRecentActivity}
              size="sm"
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 p-3 bg-white/50 rounded-lg border border-cyan-100">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.users}</p>
              <p className="text-xs text-navy-600">Users</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-cyan-600">{stats.transactions}</p>
              <p className="text-xs text-navy-600">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{stats.accounts}</p>
              <p className="text-xs text-navy-600">Accounts</p>
            </div>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No recent activity</p>
            <p className="text-gray-400 text-xs mt-1">Activities will appear here as they occur</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => {
              const badge = getActivityBadge(activity.type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-cyan-100 bg-white/50 hover:bg-cyan-50/50 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white border border-cyan-200 flex items-center justify-center shadow-sm">
                      <ActivityIcon type={activity.icon} color={activity.color} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-800 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-navy-600 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      </div>

                      {activity.amount && (
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold ${activity.icon === 'INCOME' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                            {formatCurrency(activity.amount)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${badge.color}`}
                      >
                        {badge.label}
                      </Badge>

                      {activity.category && (
                        <Badge
                          variant="outline"
                          className="text-xs border-cyan-200 bg-cyan-50 text-cyan-700"
                        >
                          {activity.category}
                        </Badge>
                      )}

                      {activity.role && activity.role !== 'user' && (
                        <Badge
                          variant="outline"
                          className="text-xs border-purple-200 bg-purple-50 text-purple-700"
                        >
                          {activity.role}
                        </Badge>
                      )}

                      <span className="text-xs text-navy-500 ml-auto">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}