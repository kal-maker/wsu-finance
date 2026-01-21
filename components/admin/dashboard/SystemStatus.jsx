'use client'

import { useState, useEffect } from 'react'
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  RefreshCw,
  AlertCircle,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const StatusIndicator = ({ status, size = 'sm' }) => {
  const config = {
    operational: {
      color: 'bg-green-500',
      label: 'Operational',
      icon: CheckCircle
    },
    degraded: {
      color: 'bg-yellow-500',
      label: 'Degraded',
      icon: AlertTriangle
    },
    down: {
      color: 'bg-red-500',
      label: 'Down',
      icon: XCircle
    },
    maintenance: {
      color: 'bg-blue-500',
      label: 'Maintenance',
      icon: AlertCircle
    }
  };

  const { color, label, icon: Icon } = config[status] || config.degraded;

  return (
    <div className="flex items-center gap-2">
      <div className={`${color} ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'} rounded-full animate-pulse`} />
      <Icon className={`h-3 w-3 ${status === 'operational' ? 'text-green-600' :
        status === 'degraded' ? 'text-yellow-600' :
          status === 'down' ? 'text-red-600' : 'text-blue-600'
        }`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

// Simplified MetricCard component without icon destructuring issues
const MetricCard = ({ icon, label, value, subtext, status, color = 'blue' }) => {
  // Safe icon rendering with fallback
  const renderIcon = () => {
    if (!icon) return <Activity className="h-4 w-4 text-gray-400" />;

    const IconComponent = icon;
    const iconColor =
      status === 'operational' ? 'text-green-600' :
        status === 'degraded' ? 'text-yellow-600' :
          status === 'down' ? 'text-red-600' : 'text-cyan-600';

    return <IconComponent className={`h-4 w-4 ${iconColor}`} />;
  };

  const bgColor =
    status === 'operational' ? 'bg-green-50 border border-green-200' :
      status === 'degraded' ? 'bg-yellow-50 border border-yellow-200' :
        status === 'down' ? 'bg-red-50 border border-red-200' : 'bg-cyan-50 border border-cyan-200';

  return (
    <div className={`bg-white/80 rounded-lg p-3 border ${status === 'operational' ? 'border-green-200' :
      status === 'degraded' ? 'border-yellow-200' :
        status === 'down' ? 'border-red-200' : 'border-cyan-200'
      }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-navy-700">{label}</p>
          <p className="text-lg font-bold text-navy-900">{value}</p>
          {subtext && <p className="text-xs text-navy-600 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          {renderIcon()}
        </div>
      </div>
    </div>
  );
};

export default function SystemStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching system status...')
      const response = await fetch('/api/admin/system-status')

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response received:', text.substring(0, 200))
        throw new Error('API returned HTML instead of JSON. Check if the route exists.')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      console.log('System status fetched successfully:', result)
      setStatus(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching system status:', err)
      setError(err.message)
      // Set fallback status data
      setStatus({
        system: { status: 'degraded', uptime: 0, timestamp: new Date().toISOString() },
        database: { status: 'degraded', responseTime: 0 },
        services: { api: 'degraded', authentication: 'degraded', fileStorage: 'degraded' },
        metrics: { users: { total: 0, recent: 0 }, transactions: { total: 0, recent: 0 }, accounts: { total: 0 } },
        performance: { memoryUsage: 0, cpuLoad: 0, responseTime: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()

    // Refresh every 30 seconds for real-time monitoring
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-navy-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-600" />
            System Status
          </CardTitle>
          {status && (
            <Badge
              variant="outline"
              className={`${status.system.status === 'operational'
                ? 'border-green-200 text-green-700 bg-green-50'
                : status.system.status === 'degraded'
                  ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                  : 'border-red-200 text-red-700 bg-red-50'
                }`}
            >
              {status.system.status === 'operational' ? 'All Systems Normal' :
                status.system.status === 'degraded' ? 'System Issues' : 'System Down'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-navy-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={fetchSystemStatus}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Status check failed</span>
            </div>
            <p className="text-amber-700 text-xs mt-1">{error}</p>
            <Button
              onClick={fetchSystemStatus}
              size="sm"
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {loading && !status ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white/80 rounded-lg p-3 border border-cyan-200 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : status ? (
          <>
            {/* System Health Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={Server}
                label="System"
                value={status.system.status === 'operational' ? 'Online' : 'Issues'}
                subtext={formatUptime(status.system.uptime)}
                status={status.system.status}
                color="cyan"
              />

              <MetricCard
                icon={Database}
                label="Database"
                value={`${status.database.responseTime}ms`}
                subtext={status.database.status}
                status={status.database.status}
                color="blue"
              />

              <MetricCard
                icon={Cpu}
                label="CPU Load"
                value={`${status.performance.cpuLoad}%`}
                subtext={status.performance.cpuLoad < 50 ? 'Normal' : 'High'}
                status={status.performance.cpuLoad < 80 ? 'operational' : 'degraded'}
                color="purple"
              />

              <MetricCard
                icon={HardDrive}
                label="Memory"
                value={`${status.performance.memoryUsage}%`}
                subtext={status.performance.memoryUsage < 70 ? 'Normal' : 'High'}
                status={status.performance.memoryUsage < 90 ? 'operational' : 'degraded'}
                color="green"
              />
            </div>

            {/* Service Status */}
            <div>
              <h4 className="text-xs font-semibold text-navy-700 mb-3 uppercase tracking-wide">
                Service Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {Object.entries(status.services).map(([service, serviceStatus]) => (
                  <div
                    key={service}
                    className="flex items-center justify-between bg-white/80 rounded-lg p-3 border border-cyan-200/50 hover:bg-cyan-50/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-navy-700 capitalize">
                      {service.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <StatusIndicator status={serviceStatus} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Application Metrics */}
            <div>
              <h4 className="text-xs font-semibold text-navy-700 mb-3 uppercase tracking-wide">
                Application Metrics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="bg-white/80 rounded-lg p-3 border border-cyan-200/50">
                  <p className="text-lg font-bold text-green-600">
                    {status.metrics?.users?.total?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-navy-600">Total Users</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-cyan-200/50">
                  <p className="text-lg font-bold text-cyan-600">
                    {status.metrics?.transactions?.total?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-navy-600">Transactions</p>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-cyan-200/50">
                  <p className="text-lg font-bold text-blue-600">
                    {status.metrics?.accounts?.total?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-navy-600">Accounts</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Unable to load system status</p>
            <Button
              onClick={fetchSystemStatus}
              size="sm"
              className="mt-3 bg-cyan-600 hover:bg-cyan-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}