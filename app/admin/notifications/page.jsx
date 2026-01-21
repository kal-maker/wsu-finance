'use client'

import { useState, useEffect } from 'react'
import { Bell, Eye, CheckCircle, AlertTriangle, Info, User, CreditCard, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action: 'markRead' })
      })
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user_created':
        return <User className="h-5 w-5 text-green-500" />
      case 'transaction_created':
      case 'large_transaction':
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case 'system_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'user_created':
        return 'border-l-green-500 bg-green-50'
      case 'transaction_created':
        return 'border-l-blue-500 bg-blue-50'
      case 'large_transaction':
        return 'border-l-orange-500 bg-orange-50'
      case 'system_alert':
        return 'border-l-red-500 bg-red-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-navy-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-navy-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin')}
              className="h-9 w-9 text-navy-700 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-cyan-600" />
              <div>
                <h1 className="text-3xl font-bold text-navy-800">Notifications</h1>
                <p className="text-navy-600">Manage and view system notifications</p>
              </div>
            </div>
          </div>

          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No notifications</h3>
              <p className="text-gray-500">System notifications will appear here</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'ring-2 ring-cyan-200' : ''
                  } transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-800">{notification.title}</h3>
                      <p className="text-navy-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-navy-500">
                        <span>{new Date(notification.timestamp).toLocaleDateString()}</span>
                        <span>{new Date(notification.timestamp).toLocaleTimeString()}</span>
                        {notification.user && (
                          <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-xs">
                            {notification.user.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 p-2 text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>


      </div>
    </div>
  )
}