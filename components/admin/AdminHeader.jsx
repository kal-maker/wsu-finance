'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { Bell, Settings, LogOut, User, Shield, AlertTriangle, CheckCircle, Info, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AdminSettings from './AdminSettings'

export default function AdminHeader({ onToggleSidebar }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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

  // Fetch real notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setNotifications(data.notifications || [])
            setUnreadCount(data.unreadCount || 0)
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        // Fallback to sample notifications
        setNotifications(getSampleNotifications())
        setUnreadCount(3)
      }
    }

    fetchNotifications()
    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const getSampleNotifications = () => [
    {
      id: 1,
      type: 'warning',
      title: 'High Expense Alert',
      message: 'Unusual expense pattern detected in Food category',
      time: '5 minutes ago',
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'info',
      title: 'New User Registered',
      message: 'John Doe just signed up for the platform',
      time: '1 hour ago',
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'success',
      title: 'System Backup Complete',
      message: 'Daily database backup completed successfully',
      time: '2 hours ago',
      read: true,
      priority: 'low'
    },
    {
      id: 4,
      type: 'warning',
      title: 'Suspicious Activity',
      message: 'Multiple failed login attempts detected',
      time: '3 hours ago',
      read: true,
      priority: 'high'
    }
  ]

  const handleSignOut = () => {
    signOut(() => router.push('/'))
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
      case 'success':
        return <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
      case 'info':
      default:
        return <Info className="h-3 w-3 md:h-4 md:w-4 text-cyan-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400'
      case 'medium':
        return 'border-l-amber-400'
      case 'low':
      default:
        return 'border-l-cyan-400'
    }
  }

  return (
    <>
      <header className="border-b border-cyan-200/50 bg-gradient-to-r from-navy-50/90 to-cyan-50/90 backdrop-blur-lg h-14 md:h-16 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-50 shadow-sm">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 md:h-9 md:w-9 text-navy-600 hover:text-cyan-600 hover:bg-cyan-50/50"
          >
            <Menu className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <div className="flex items-center gap-1 md:gap-2">
            <div className="h-6 w-6 md:h-8 md:w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-navy-600 flex items-center justify-center">
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-white" />
            </div>
            <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              {isMobile ? 'WSU Admin' : 'WSU Finance Admin'}
            </h1>
          </div>
        </div>

        {/* Right Section - Notifications and User Menu */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 md:h-9 md:w-9 text-navy-600 hover:text-cyan-600 hover:bg-cyan-50/50"
              >
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 md:h-5 md:w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={`w-80 md:w-96 max-h-80 md:max-h-96 overflow-y-auto ${isMobile ? 'mr-2' : ''}`}
              align="end"
            >
              <DropdownMenuLabel className="flex items-center justify-between p-3">
                <span className="text-navy-800 text-sm md:text-base">Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-600 hover:text-cyan-700 h-auto py-1"
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-navy-600">
                  <Bell className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-navy-400" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-2 md:p-3 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} ${!notification.read ? 'bg-cyan-50/50' : ''
                        }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-2 md:gap-3 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-0.5 md:mb-1">
                            <p className="text-xs md:text-sm font-medium text-navy-800 truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1 ml-1 md:ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-navy-600 mb-0.5 md:mb-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-navy-400">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-cyan-600 justify-center font-medium text-xs md:text-sm py-2"
                onClick={() => router.push('/admin/notifications')}
              >
                View All Notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-7 w-7 md:h-9 md:w-9 rounded-full border border-cyan-200/70 hover:border-cyan-300 p-0"
              >
                <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-cyan-500 to-navy-600 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-56 ${isMobile ? 'mr-2' : ''}`} align="end">
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-navy-800 truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-navy-600 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-1 border-cyan-200 bg-cyan-50 text-cyan-700 text-xs w-fit"
                  >
                    Administrator
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/dashboard')}
                className="text-sm py-2"
              >
                <User className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                User Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsSettingsOpen(true)}
                className="text-sm py-2"
              >
                <Settings className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Admin Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 text-sm py-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Admin Settings Modal */}
      <AdminSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}