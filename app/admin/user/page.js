'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, RefreshCw, Ban, CheckCircle, Eye, Mail, Calendar, CreditCard, AlertCircle } from 'lucide-react'

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
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState(null)

  const fetchUsers = async (filterParams = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      Object.entries({ ...filters, ...filterParams }).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
      
      console.log('Fetching users with params:', Object.fromEntries(queryParams))
      
      const response = await fetch(`/api/admin/users?${queryParams}`)
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
        console.log('Users loaded successfully:', data.users.length)
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
        console.log('User role updated successfully')
      } else {
        const errorMsg = data.message || data.error || 'Failed to update role'
        setError(errorMsg)
        console.error('Failed to update role:', errorMsg)
      }
    } catch (error) {
      const errorMsg = 'Network error: Failed to update role'
      setError(errorMsg)
      console.error('Error updating user role:', error)
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
        console.log(`User ${newStatus} successfully`)
      } else {
        const errorMsg = data.message || data.error || `Failed to ${newStatus} user`
        setError(errorMsg)
        console.error('Failed to update status:', errorMsg)
      }
    } catch (error) {
      const errorMsg = 'Network error: Failed to update user status'
      setError(errorMsg)
      console.error('Error updating user status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const sendEmailToUser = (userEmail) => {
    if (userEmail && userEmail !== 'No email') {
      window.open(`mailto:${userEmail}?subject=Account Notification&body=Dear user,`, '_blank')
    } else {
      setError('User does not have a valid email address')
    }
  }

  const viewUserDetails = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
    console.log('Viewing user details:', user)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: ''
    })
    // Don't fetch here - let the useEffect handle it
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const bannedUsers = users.filter(u => u.status === 'banned').length
    const adminUsers = users.filter(u => u.role === 'admin').length
    const userRoleUsers = users.filter(u => u.role === 'user').length
    const totalTransactions = users.reduce((sum, user) => sum + user.transactionCount, 0)

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div className="text-red-700 flex-1">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts ({users.length} users)
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchUsers()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-cyan-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-cyan-500">{stats.totalUsers}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="p-4 bg-green-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="p-4 bg-red-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-500">{stats.bannedUsers}</div>
          <div className="text-sm text-muted-foreground">Banned</div>
        </div>
        <div className="p-4 bg-amber-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-amber-500">{stats.adminUsers}</div>
          <div className="text-sm text-muted-foreground">Admins</div>
        </div>
        <div className="p-4 bg-blue-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.userRoleUsers}</div>
          <div className="text-sm text-muted-foreground">Users</div>
        </div>
        <div className="p-4 bg-purple-500/10 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-500">{stats.totalTransactions}</div>
          <div className="text-sm text-muted-foreground">Transactions</div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border border-border">
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="mt-6 border border-border rounded-lg">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 font-medium">
            <div className="col-span-3">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Activity</div>
            <div className="col-span-2">Actions</div>
          </div>
          
          {users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {loading ? 'Loading users...' : 'No users found matching your criteria'}
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-muted/50">
                <div className="col-span-3 flex items-center gap-3">
                  <img 
                    src={user.image || '/default-avatar.png'} 
                    alt={user.name}
                    className="h-10 w-10 rounded-full border"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png'
                    }}
                  />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="col-span-3 flex items-center">
                  <div>
                    <p className={user.email === 'No email' ? 'text-muted-foreground italic' : ''}>
                      {user.email}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <select 
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={actionLoading === `role-${user.id}`}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <CreditCard className="h-3 w-3" />
                      {user.transactionCount} trans
                    </div>
                    {user.lastActive && (
                      <div className="text-xs text-muted-foreground">
                        Active: {new Date(user.lastActive).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.status)}
                    disabled={actionLoading === `status-${user.id}`}
                    className={`p-2 rounded-lg transition-colors ${
                      user.status === 'active' 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    } disabled:opacity-50`}
                    title={user.status === 'active' ? 'Ban User' : 'Activate User'}
                  >
                    {user.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={() => sendEmailToUser(user.email)}
                    disabled={user.email === 'No email'}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                    title="Send Email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => viewUserDetails(user)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedUser.image || '/default-avatar.png'} 
                  alt={selectedUser.name}
                  className="h-16 w-16 rounded-full border"
                />
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Status</p>
                  <p className={selectedUser.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                    {selectedUser.status}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Role</p>
                  <p>{selectedUser.role}</p>
                </div>
                <div>
                  <p className="font-medium">Joined</p>
                  <p>{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">Transactions</p>
                  <p>{selectedUser.transactionCount}</p>
                </div>
              </div>
              
              {selectedUser.lastActive && (
                <div>
                  <p className="font-medium text-sm">Last Active</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedUser.lastActive).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => toggleUserStatus(selectedUser.id, selectedUser.status)}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  selectedUser.status === 'active' 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {selectedUser.status === 'active' ? 'Ban User' : 'Activate User'}
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}