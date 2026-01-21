'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, Download, RefreshCw, Eye, CreditCard, Calendar, User, AlertCircle, Menu, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCurrency } from '@/context/currency-context'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    status: '',
    dateRange: '',
    minAmount: '',
    maxAmount: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const { currency, fmt } = useCurrency()

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    extractCategories()
  }, [transactions])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/transactions')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions || [])
      } else {
        setError(data.error || 'Failed to load transactions')
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Network error: Failed to fetch transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const extractCategories = () => {
    const uniqueCategories = [...new Set(transactions.map(t => t.category))].filter(Boolean)
    setCategories(uniqueCategories)
  }

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      const response = await fetch('/api/admin/transactions/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId, status: newStatus }),
      })

      if (response.ok) {
        fetchTransactions()
      }
    } catch (error) {
      console.error('Error updating transaction status:', error)
    }
  }

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'User', 'Type', 'Amount', 'Category', 'Description', 'Status'],
      ...filteredTransactions.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.user?.name || 'Unknown',
        tx.type,
        fmt(tx.amount).replace(/[^0-9.-]/g, '') + ' ' + currency,
        tx.category,
        tx.description || '',
        tx.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !filters.search ||
      transaction.user?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesType = !filters.type || transaction.type === filters.type
    const matchesCategory = !filters.category || transaction.category === filters.category
    const matchesStatus = !filters.status || transaction.status === filters.status

    const matchesAmount = (!filters.minAmount || parseFloat(transaction.amount) >= parseFloat(filters.minAmount)) &&
      (!filters.maxAmount || parseFloat(transaction.amount) <= parseFloat(filters.maxAmount))

    const transactionDate = new Date(transaction.date)
    const matchesDateRange = !filters.dateRange || (
      filters.dateRange === 'today' && isToday(transactionDate) ||
      filters.dateRange === 'week' && isThisWeek(transactionDate) ||
      filters.dateRange === 'month' && isThisMonth(transactionDate)
    )

    return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesAmount && matchesDateRange
  })

  // Date helper functions
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isThisWeek = (date) => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    return date >= startOfWeek
  }

  const isThisMonth = (date) => {
    const today = new Date()
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      status: '',
      dateRange: '',
      minAmount: '',
      maxAmount: ''
    })
    setShowFilters(false)
    setShowMobileFilters(false)
  }

  const formatCurrency = (amount) => {
    return fmt(amount)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-cyan-600" />
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              Transaction Monitoring
            </h1>
            <p className="text-navy-600 text-sm md:text-base">Loading transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Error Alert */}
      {error && (
        <div className="p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-amber-700 text-sm md:text-base flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-amber-500 hover:text-amber-700 text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-cyan-600" />
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              Transaction Monitoring
            </h1>
            <p className="text-navy-600 text-sm md:text-base mt-1">
              Monitor all financial transactions
              {transactions.length > 0 && ` (${transactions.length} transactions)`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportTransactions}
            className="bg-green-600 hover:bg-green-700 text-sm md:text-base w-full md:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-navy-800 flex items-center gap-2 text-base md:text-lg">
            <Filter className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
            Transaction Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 h-3 w-3 md:h-4 md:w-4" />
              <input
                type="text"
                placeholder="Search by user, description, or category..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 md:pl-10 pr-4 py-2 border border-cyan-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-navy-800 text-sm md:text-base"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => isMobile ? setShowMobileFilters(!showMobileFilters) : setShowFilters(!showFilters)}
                variant="outline"
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 flex-1 md:flex-none text-sm"
                size={isMobile ? "sm" : "default"}
              >
                {isMobile ? (showMobileFilters ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />) : <Filter className="h-3 w-3 md:h-4 md:w-4 mr-2" />}
                {isMobile ? 'Filters' : 'Filters'}
              </Button>

              <Button
                onClick={fetchTransactions}
                className="bg-cyan-600 hover:bg-cyan-700 flex-1 md:flex-none text-sm"
                size={isMobile ? "sm" : "default"}
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {(showFilters || showMobileFilters) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-lg border border-cyan-200/50">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Min Amount ({currency})</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Max Amount ({currency})</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                  placeholder="100000"
                />
              </div>

              <div className="md:col-span-2 flex items-end gap-2">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-sm"
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={() => {
                    setShowFilters(false)
                    setShowMobileFilters(false)
                  }}
                  variant="outline"
                  className="flex-1 border-navy-200 text-navy-700 hover:bg-navy-50 text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table Card */}
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-navy-800 flex items-center gap-2 text-base md:text-lg">
            <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
            Transactions List ({filteredTransactions.length} transactions)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="border border-cyan-200/50 rounded-lg bg-white/50 overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border-b border-cyan-200/50 bg-cyan-50/50 font-medium text-navy-800">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">User & Description</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Actions</div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-6 md:p-8 text-center text-navy-600">
                <p className="text-sm md:text-base">No transactions found matching your filters</p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 text-sm"
                    size="sm"
                  >
                    Clear filters to see all transactions
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-cyan-200/50">
                {filteredTransactions.map(transaction => (
                  <div key={transaction.id} className="p-4 hover:bg-cyan-50/30 transition-colors">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-3 w-3 text-navy-500" />
                            <span className="text-sm font-medium text-navy-800">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-navy-500" />
                            <span className="text-sm text-navy-700">
                              {transaction.user?.name || 'Unknown User'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            onClick={() => viewTransactionDetails(transaction)}
                            size="sm"
                            variant="outline"
                            className="p-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-navy-500">Type</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${transaction.type === 'INCOME'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                                }`}
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-navy-500">Category</p>
                            <Badge
                              variant="outline"
                              className="text-xs border-cyan-200 bg-cyan-50 text-cyan-700"
                            >
                              {transaction.category}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-navy-500">Amount</p>
                          <p className={`text-lg font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>

                        {transaction.description && (
                          <div>
                            <p className="text-xs text-navy-500">Description</p>
                            <p className="text-sm text-navy-700 truncate">
                              {transaction.description}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-navy-600">
                          {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <div className="flex items-center gap-1 text-navy-700">
                          <Calendar className="h-3 w-3" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <span className="text-xs text-navy-600">
                          {new Date(transaction.date).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3 w-3 text-navy-500" />
                          <p className="font-medium text-navy-800">{transaction.user?.name || 'Unknown User'}</p>
                        </div>
                        <p className="text-sm text-navy-600 truncate">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-navy-500">{transaction.user?.email}</p>
                      </div>

                      <div className="col-span-1">
                        <Badge
                          variant="outline"
                          className={
                            transaction.type === 'INCOME'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </div>

                      <div className="col-span-2">
                        <span className={`font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <Badge
                          variant="outline"
                          className="border-cyan-200 bg-cyan-50 text-cyan-700"
                        >
                          {transaction.category}
                        </Badge>
                      </div>

                      <div className="col-span-1">
                        <Button
                          onClick={() => viewTransactionDetails(transaction)}
                          size="sm"
                          variant="outline"
                          className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center text-sm text-navy-600 gap-2">
            <span className="text-sm">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            {hasActiveFilters && (
              <span className="text-amber-600 text-sm">
                Filters applied • <button onClick={clearFilters} className="underline">Clear all</button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md md:max-w-2xl w-full border-cyan-200 max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-white z-10 border-b">
              <CardTitle className="text-navy-800 flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-cyan-600" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-navy-700 mb-2">Transaction Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-navy-500">Amount</p>
                      <p className={`text-lg md:text-xl font-bold ${selectedTransaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTransaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Type</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedTransaction.type === 'INCOME'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }
                      >
                        {selectedTransaction.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Category</p>
                      <p className="text-sm text-navy-800">{selectedTransaction.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Date & Time</p>
                      <p className="text-sm text-navy-800">
                        {new Date(selectedTransaction.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-navy-700 mb-2">User Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-navy-500">User Name</p>
                      <p className="text-sm text-navy-800">{selectedTransaction.user?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Email</p>
                      <p className="text-sm text-navy-800">{selectedTransaction.user?.email || 'No email'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-navy-500">Account</p>
                      <p className="text-sm text-navy-800">{selectedTransaction.account?.name || 'Unknown account'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-navy-700 mb-2">Description</h4>
                <p className="text-sm text-navy-800 bg-white/50 p-3 rounded-lg border border-cyan-200">
                  {selectedTransaction.description || 'No description provided'}
                </p>
              </div>

              {selectedTransaction.receiptUrl && (
                <div>
                  <h4 className="text-sm font-medium text-navy-700 mb-2">Receipt</h4>
                  <a
                    href={selectedTransaction.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 text-sm inline-flex items-center gap-1"
                  >
                    View Receipt ↗
                  </a>
                </div>
              )}
            </CardContent>
            <CardContent className="flex gap-3 p-4 border-t border-cyan-200">
              <Button
                onClick={() => setShowTransactionModal(false)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-sm md:text-base"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}