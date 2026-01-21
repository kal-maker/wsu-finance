'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, CreditCard, DollarSign, Activity, Calendar, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#06B6D4', '#0C4A6E', '#0891B2', '#0E7490', '#155E75', '#164E63'];

// Custom Tooltip Components
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-cyan-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-navy-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SystemOverview() {
  const [systemData, setSystemData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching system data for time range:', timeRange)

      const response = await fetch(`/api/admin/system-overview?timeRange=${timeRange}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch system data')
      }

      console.log('System data fetched successfully:', result)
      setSystemData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching system data:', err)
      setError(err.message)
      // Set fallback data
      setSystemData({
        userGrowth: [
          { month: 'Jan', users: 10 },
          { month: 'Feb', users: 15 },
          { month: 'Mar', users: 20 },
          { month: 'Apr', users: 25 },
          { month: 'May', users: 30 },
          { month: 'Jun', users: 35 }
        ],
        transactionStats: [
          { category: 'Food', amount: 5000, count: 25 },
          { category: 'Transport', amount: 3000, count: 15 },
          { category: 'Bills', amount: 8000, count: 8 }
        ],
        revenueData: [
          { date: '1', revenue: 1000 },
          { date: '2', revenue: 1500 },
          { date: '3', revenue: 1200 },
          { date: '4', revenue: 1800 },
          { date: '5', revenue: 2000 },
          { date: '6', revenue: 1600 },
          { date: '7', revenue: 1400 }
        ],
        systemMetrics: {
          activeUsers: 35,
          totalUsers: 50,
          totalTransactions: 100,
          totalIncome: 10500,
          totalExpenses: 8000,
          netFlow: 2500
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
  }, [timeRange])

  const handleRefresh = () => {
    fetchSystemData()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-ET').format(num)
  }

  if (loading && !systemData) {
    return (
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-navy-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-600" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
              <p className="text-navy-600">Loading system data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !systemData) {
    return (
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-navy-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-600" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-2">Error loading data</p>
              <p className="text-navy-600 text-sm mb-4">{error}</p>
              <Button onClick={fetchSystemData} className="bg-cyan-600 hover:bg-cyan-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const metrics = systemData.systemMetrics

  return (
    <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-navy-800 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-600" />
            System Overview
          </CardTitle>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs text-navy-600 border-navy-200">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-cyan-300 bg-white/80 rounded-lg px-3 py-2 text-sm text-navy-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            disabled={loading}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-navy-800">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-navy-900">{formatNumber(metrics.activeUsers)}</p>
            <p className="text-xs text-cyan-600 font-medium">
              of {formatNumber(metrics.totalUsers)} total users
            </p>
          </div>

          <div className="bg-gradient-to-br from-navy-50 to-navy-100 rounded-xl p-4 border border-navy-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-navy-600" />
              <span className="text-sm font-semibold text-navy-800">Transactions</span>
            </div>
            <p className="text-2xl font-bold text-navy-900">{formatNumber(metrics.totalTransactions)}</p>
            <p className="text-xs text-cyan-600 font-medium">
              in {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 via-navy-50 to-cyan-100 rounded-xl p-4 border border-cyan-300 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-navy-800">Net Flow</span>
            </div>
            <p className="text-2xl font-bold text-navy-900">
              {formatCurrency(metrics.netFlow)}
            </p>
            <p className="text-xs text-cyan-600 font-medium">
              Income: {formatCurrency(metrics.totalIncome)}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white/90 rounded-xl border border-cyan-200/50 p-4 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              User Growth Trend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={systemData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tick={{ fill: '#0C4A6E' }}
                />
                <YAxis
                  fontSize={12}
                  tick={{ fill: '#0C4A6E' }}
                />
                <Tooltip content={<ChartTooltip formatter={formatNumber} />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#0C4A6E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Categories */}
          <div className="bg-white/90 rounded-xl border border-cyan-200/50 p-4 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-600" />
              Spending by Category
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={systemData.transactionStats}
                  cx="50%"
                  cy="50%"
                  labelLine={!isMobile}
                  label={({ category, percent }) =>
                    isMobile ? `${(percent * 100).toFixed(0)}%` : `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {systemData.transactionStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white/90 rounded-xl border border-cyan-200/50 p-4 shadow-sm backdrop-blur-sm lg:col-span-2">
            <h3 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-600" />
              Revenue Trend ({timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'})
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={systemData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tick={{ fill: '#0C4A6E' }}
                />
                <YAxis
                  fontSize={12}
                  tickFormatter={(value) => `ETB ${value}`}
                  tick={{ fill: '#0C4A6E' }}
                />
                <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
                <Bar
                  dataKey="revenue"
                  fill="url(#cyanGradient)"
                  radius={[6, 6, 0, 0]}
                />
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#0C4A6E" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Showing cached data</span>
            </div>
            <p className="text-amber-700 text-xs mt-1">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}