'use client'

import { useEffect, useState } from 'react'
import { Users, CreditCard, Brain, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/context/currency-context'

const statsConfig = [
  {
    title: 'Total Users',
    key: 'totalUsers',
    icon: Users,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    title: 'Active Users',
    key: 'activeUsers',
    icon: Zap,
    color: 'text-aqua-500',
    bgColor: 'bg-aqua-500/10',
  },
  {
    title: 'Transactions',
    key: 'totalTransactions',
    icon: CreditCard,
    color: 'text-turquoise-500',
    bgColor: 'bg-turquoise-500/10',
  },
  {
    title: 'Total Income',
    key: 'totalIncome',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    format: 'currency'
  },
  {
    title: 'Total Expenses',
    key: 'totalExpenses',
    icon: TrendingUp,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    format: 'currency'
  },
  {
    title: 'Active Budgets',
    key: 'activeBudgets',
    icon: Brain,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
]

export default function QuickStats() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const { fmt } = useCurrency()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value, format) => {
    if (value === undefined || value === null) return '0'

    if (format === 'currency') {
      return fmt(value)
    }
    return value.toLocaleString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsConfig.map((stat, index) => (
          <Card key={stat.title} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsConfig.map((stat, index) => (
        <Card
          key={stat.title}
          className="animate-fade-in-up border-border/40 bg-card/60 backdrop-blur-xs hover:shadow-glow-cyan/10 transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-3 w-3 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatValue(stats[stat.key], stat.format)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}