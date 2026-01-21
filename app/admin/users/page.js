'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, RefreshCw, Ban, CheckCircle, Eye, Calendar, CreditCard, AlertCircle, Users, Shield, Menu, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchUsers = async (filterParams = {}) => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      Object.entries({ ...filters, ...filterParams }).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const response = await fetch(`/api/admin/users?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
      } else {
        setError(data.error || 'Failed to load users')
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Network error: Failed to fetch users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchUsers()
  }, [])

  // Debounced search - refetch when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  // Refetch when role or status filters change
  useEffect(() => {
    if (filters.role || filters.status) {
      fetchUsers()
    }
  }, [filters.role, filters.status])

  const updateUserRole = async (userId, newRole) => {
    try {
      setActionLoading(`role-${userId}`)
      setError(null)

      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      })

      const data = await response.json()

      if (data.success) {
        setUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ))
      } else {
        const errorMsg = data.message || data.error || 'Failed to update role'
        setError(errorMsg)
      }
    } catch (error) {
      const errorMsg = 'Network error: Failed to update role'
      setError(errorMsg)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(`status-${userId}`)
      setError(null)

      const newStatus = currentStatus === 'active' ? 'banned' : 'active'

      const response = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status: newStatus
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        ))
      } else {
        const errorMsg = data.message || data.error || `Failed to ${newStatus} user`
        setError(errorMsg)
      }
    } catch (error) {
      const errorMsg = 'Network error: Failed to update user status'
      setError(errorMsg)
    } finally {
      setActionLoading(null)
    }
  }

  const viewUserDetails = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: ''
    })
    setShowFilters(false)
    setShowMobileFilters(false)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const bannedUsers = users.filter(u => u.status === 'banned').length
    const adminUsers = users.filter(u => u.role === 'admin').length
    const userRoleUsers = users.filter(u => u.role === 'user').length
    const totalTransactions = users.reduce((sum, user) => sum + (user.transactionCount || 0), 0)

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      adminUsers,
      userRoleUsers,
      totalTransactions
    }
  }, [users])

  if (loading && users.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 md:h-8 md:w-8 text-cyan-600" />
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-navy-600 mt-1 md:mt-2 text-sm md:text-base">Loading users...</p>
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
          <Users className="h-6 w-6 md:h-8 md:w-8 text-cyan-600" />
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-navy-600 text-sm md:text-base">
              Manage user accounts ({users.length} users)
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchUsers()}
            className="bg-cyan-600 hover:bg-cyan-700 text-sm md:text-base w-full md:w-auto"
            size={isMobile ? "sm" : "default"}
          >
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-cyan-600">{stats.totalUsers}</div>
            <div className="text-xs md:text-sm text-cyan-700 font-medium">Total Users</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-xs md:text-sm text-green-700 font-medium">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-red-600">{stats.bannedUsers}</div>
            <div className="text-xs md:text-sm text-red-700 font-medium">Banned</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-amber-600">{stats.adminUsers}</div>
            <div className="text-xs md:text-sm text-amber-700 font-medium">Admins</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.userRoleUsers}</div>
            <div className="text-xs md:text-sm text-blue-700 font-medium">Users</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="text-lg md:text-2xl font-bold text-purple-600">{stats.totalTransactions}</div>
            <div className="text-xs md:text-sm text-purple-700 font-medium">Transactions</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Card */}
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-navy-800 flex items-center gap-2 text-base md:text-lg">
            <Filter className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
            User Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6 pt-0">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 h-3 w-3 md:h-4 md:w-4" />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
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

              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 flex-1 md:flex-none text-sm"
                  size={isMobile ? "sm" : "default"}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {(showFilters || showMobileFilters) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-white/50 rounded-lg border border-cyan-200/50">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setShowFilters(false)
                    setShowMobileFilters(false)
                  }}
                  variant="outline"
                  className="w-full border-navy-200 text-navy-700 hover:bg-navy-50 text-sm"
                >
                  Close Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card className="border-cyan-200/50 bg-gradient-to-br from-navy-50/80 to-cyan-50/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-navy-800 flex items-center gap-2 text-base md:text-lg">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
            Users List ({users.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="border border-cyan-200/50 rounded-lg bg-white/50 overflow-hidden">
            {/* Mobile Table Header (Hidden) */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 border-b border-cyan-200/50 bg-cyan-50/50 font-medium text-navy-800">
              <div className="col-span-3">User</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Activity</div>
              <div className="col-span-2">Actions</div>
            </div>

            {users.length === 0 ? (
              <div className="p-6 md:p-8 text-center text-navy-600 text-sm md:text-base">
                {loading ? 'Loading users...' : 'No users found matching your criteria'}
              </div>
            ) : (
              <div className="divide-y divide-cyan-200/50">
                {users.map(user => (
                  <div key={user.id} className="p-4 hover:bg-cyan-50/30 transition-colors">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.clerkUserId}`}
                            alt={user.name}
                            className="h-10 w-10 rounded-full border border-cyan-200"
                            onError={(e) => {
                              e.target.src = '/default-avatar.png'
                            }}
                          />
                          <div>
                            <p className="font-medium text-navy-800 text-sm">{user.name}</p>
                            <Badge
                              variant="outline"
                              className={`mt-1 text-xs ${user.status === 'active'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                                }`}
                            >
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            disabled={actionLoading === `status-${user.id}`}
                            size="sm"
                            variant="outline"
                            className={`p-2 ${user.status === 'active'
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            title={user.status === 'active' ? 'Ban User' : 'Activate User'}
                          >
                            {user.status === 'active' ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          </Button>
                          <Button
                            onClick={() => viewUserDetails(user)}
                            size="sm"
                            variant="outline"
                            className="p-2 border-navy-200 text-navy-600 hover:bg-navy-50"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-navy-600">Email</p>
                          <p className={`text-sm ${user.email === 'No email' ? 'text-navy-400 italic' : 'text-navy-700'}`}>
                            {user.email}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-navy-600">Role</p>
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              disabled={actionLoading === `role-${user.id}`}
                              className="w-full px-2 py-1 border border-cyan-200 rounded text-sm disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-navy-800 bg-white"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <p className="text-xs text-navy-600">Joined</p>
                            <p className="text-sm text-navy-700">
                              {new Date(user.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-navy-600">Activity</p>
                          <div className="flex items-center gap-2 text-sm text-navy-700">
                            <CreditCard className="h-3 w-3" />
                            <span>{user.transactionCount || 0} transactions</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 flex items-center gap-3">
                        <img
                          src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.clerkUserId}`}
                          alt={user.name}
                          className="h-10 w-10 rounded-full border border-cyan-200"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png'
                          }}
                        />
                        <div>
                          <p className="font-medium text-navy-800">{user.name}</p>
                          <p className="text-xs text-navy-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <p className={user.email === 'No email' ? 'text-navy-400 italic' : 'text-navy-700'}>
                          {user.email}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${user.status === 'active'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                        >
                          {user.status}
                        </Badge>
                      </div>

                      <div className="col-span-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          disabled={actionLoading === `role-${user.id}`}
                          className="w-full px-3 py-2 border border-cyan-200 rounded-lg bg-white text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-navy-800"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-navy-700">
                            <CreditCard className="h-3 w-3" />
                            {user.transactionCount || 0} trans
                          </div>
                          {user.lastActive && (
                            <div className="text-xs text-navy-600">
                              Active: {new Date(user.lastActive).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center gap-2">
                        <Button
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          disabled={actionLoading === `status-${user.id}`}
                          size="sm"
                          variant="outline"
                          className={`${user.status === 'active'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          title={user.status === 'active' ? 'Ban User' : 'Activate User'}
                        >
                          {user.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>

                        <Button
                          onClick={() => viewUserDetails(user)}
                          size="sm"
                          variant="outline"
                          className="border-navy-200 text-navy-600 hover:bg-navy-50"
                          title="View Details"
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
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full border-cyan-200 max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-white z-10 border-b">
              <CardTitle className="text-navy-800 flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-cyan-600" />
                User Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.image || '/default-avatar.png'}
                  alt={selectedUser.name}
                  className="h-12 w-12 md:h-16 md:w-16 rounded-full border border-cyan-200"
                />
                <div>
                  <p className="font-semibold text-navy-800 text-sm md:text-base">{selectedUser.name}</p>
                  <p className="text-xs md:text-sm text-navy-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
                <div>
                  <p className="font-medium text-navy-700 text-xs md:text-sm">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedUser.status === 'active'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-navy-700 text-xs md:text-sm">Role</p>
                  <Badge
                    variant="outline"
                    className="border-cyan-200 bg-cyan-50 text-cyan-700"
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-navy-700 text-xs md:text-sm">Joined</p>
                  <p className="text-navy-600 text-xs md:text-sm">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-navy-700 text-xs md:text-sm">Transactions</p>
                  <p className="text-navy-600 text-xs md:text-sm">{selectedUser.transactionCount || 0}</p>
                </div>
              </div>

              {selectedUser.lastActive && (
                <div>
                  <p className="font-medium text-xs text-navy-700">Last Active</p>
                  <p className="text-xs text-navy-600">
                    {new Date(selectedUser.lastActive).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
            <CardContent className="flex flex-col md:flex-row gap-2 md:gap-3 p-4 border-t border-cyan-200">
              <Button
                onClick={() => toggleUserStatus(selectedUser.id, selectedUser.status)}
                className={`${selectedUser.status === 'active'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
                  } text-sm`}
              >
                {selectedUser.status === 'active' ? 'Ban User' : 'Activate User'}
              </Button>
              <Button
                onClick={() => setShowUserModal(false)}
                variant="outline"
                className="border-cyan-200 text-navy-700 hover:bg-cyan-50 text-sm"
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