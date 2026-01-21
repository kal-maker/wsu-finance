'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Shield,
  Bell,
  Mail,
  Users,
  CreditCard,
  Save,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  RefreshCw,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { useCurrency } from '@/context/currency-context'

// Default settings structure
const defaultSettings = {
  system: {
    systemName: 'WSU Finance Platform',
    systemEmail: 'admin@wsu.edu',
    maintenanceMode: false
  },
  security: {
    require2FA: true,
    sessionTimeout: 5,
    maxLoginAttempts: 5
  },
  notifications: {
    emailNotifications: true,
    securityAlerts: true,
    systemUpdates: true,
    budgetAlerts: true
  },
  financial: {
    defaultCurrency: 'ETB'
  },
  users: {
    allowRegistrations: true,
    requireEmailVerification: true,
    defaultUserRole: 'user'
  }
}

export default function AdminSettings({ isOpen, onClose }) {
  const { setCurrency } = useCurrency()
  const [settings, setSettings] = useState(null)
  const [activeTab, setActiveTab] = useState('system')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setShowMobileMenu(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load settings on component mount
  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
        } else {
          // Use default settings if API fails or returns no data
          setSettings(defaultSettings)
          setMessage({ type: 'warning', text: 'Using default settings' })
        }
      } else {
        // Use default settings if API fails
        setSettings(defaultSettings)
        setMessage({ type: 'warning', text: 'Using default settings' })
      }
    } catch (error) {
      // Use default settings if API fails
      setSettings(defaultSettings)
      setMessage({ type: 'warning', text: 'Using default settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage({ type: 'success', text: 'Settings saved successfully!' })

          // Perform specific actions based on changed settings
          if (settings.system?.maintenanceMode) {
            await updateMaintenanceMode(true)
          }

          // Update global currency context if changed
          if (settings.financial?.defaultCurrency) {
            setCurrency(settings.financial.defaultCurrency)
          }
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to save settings' })
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateMaintenanceMode = async (enabled) => {
    try {
      const response = await fetch('/api/admin/settings/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          message: 'System maintenance in progress. Please try again later.'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`)
        }
      }
    } catch (error) {
      console.error('Error updating maintenance mode:', error)
    }
  }

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => {
      if (!prev) return prev

      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }
    })
  }

  // Safe value getter with fallbacks
  const getSettingValue = (category, key, fallback = '') => {
    if (!settings || !settings[category]) return fallback
    return settings[category][key] ?? fallback
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden border border-cyan-200">
          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="text-center">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-cyan-500 mx-auto mb-3 md:mb-4" />
              <p className="text-navy-600 text-sm md:text-base">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden border border-cyan-200">
          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-amber-500 mx-auto mb-3 md:mb-4" />
              <p className="text-navy-600 text-sm md:text-base">Failed to load settings</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm md:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-auto max-h-[90vh] overflow-hidden border border-cyan-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-navy-50">
          <div className="flex items-center gap-3">
            {isMobile && showMobileMenu ? (
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1 hover:bg-cyan-100 rounded-lg transition-colors text-navy-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <Settings className="h-5 w-5 md:h-6 md:w-6 text-cyan-600" />
            )}
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-navy-800">Admin Settings</h2>
              <p className="text-xs md:text-sm text-navy-600">Manage system configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && !showMobileMenu && (
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 hover:bg-cyan-100 rounded-lg transition-colors text-navy-600"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyan-100 rounded-lg transition-colors text-navy-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mx-4 md:mx-6 mt-3 md:mt-4 p-3 rounded-lg border ${message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : message.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <div className="w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
              ) : (
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm md:text-base">{message.text}</span>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation - Desktop & Mobile Menu */}
          {(showMobileMenu || !isMobile) && (
            <div className={`${isMobile ? 'w-full absolute inset-0 bg-white z-10' : 'w-64 border-r border-cyan-200 bg-cyan-50/30'} flex-shrink-0`}>
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('system')
                    if (isMobile) setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'system'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-navy-700 hover:bg-cyan-100'
                    }`}
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </button>

                <button
                  onClick={() => {
                    setActiveTab('security')
                    if (isMobile) setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'security'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-navy-700 hover:bg-cyan-100'
                    }`}
                >
                  <Shield className="h-4 w-4" />
                  Security
                </button>

                <button
                  onClick={() => {
                    setActiveTab('notifications')
                    if (isMobile) setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'notifications'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-navy-700 hover:bg-cyan-100'
                    }`}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </button>

                <button
                  onClick={() => {
                    setActiveTab('financial')
                    if (isMobile) setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'financial'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-navy-700 hover:bg-cyan-100'
                    }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Financial
                </button>

                <button
                  onClick={() => {
                    setActiveTab('users')
                    if (isMobile) setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-navy-700 hover:bg-cyan-100'
                    }`}
                >
                  <Users className="h-4 w-4" />
                  User Management
                </button>
              </nav>
            </div>
          )}

          {/* Content Area */}
          <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${showMobileMenu && isMobile ? 'hidden' : ''}`}>
            {activeTab === 'system' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-base md:text-lg font-semibold text-navy-800">System Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      System Name
                    </label>
                    <input
                      type="text"
                      value={getSettingValue('system', 'systemName', 'WSU Finance Platform')}
                      onChange={(e) => handleSettingChange('system', 'systemName', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      System Email
                    </label>
                    <input
                      type="email"
                      value={getSettingValue('system', 'systemEmail', 'admin@wsu.edu')}
                      onChange={(e) => handleSettingChange('system', 'systemEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={getSettingValue('system', 'timezone', 'Africa/Addis_Ababa')}
                      onChange={(e) => handleSettingChange('system', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                    >
                      <option value="Africa/Addis_Ababa">East Africa Time (EAT)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Date Format
                    </label>
                    <select
                      value={getSettingValue('system', 'dateFormat', 'DD/MM/YYYY')}
                      onChange={(e) => handleSettingChange('system', 'dateFormat', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between p-3 md:p-4 border border-cyan-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-navy-800 text-sm md:text-base">Maintenance Mode</p>
                      <p className="text-xs md:text-sm text-navy-600">Put the system in maintenance mode</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={getSettingValue('system', 'maintenanceMode', false)}
                        onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 md:w-11 md:h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>

                {/* Inngest Automation Testing */}
                <div className="p-3 md:p-4 border border-cyan-200 rounded-lg bg-purple-50/30">
                  <div className="space-y-3 md:space-y-4">
                    <p className="font-medium text-navy-800 text-sm md:text-base">Inngest Automation Testing</p>
                    <p className="text-xs md:text-sm text-navy-600">Manually trigger automated processes</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                      <button
                        onClick={async () => {
                          setMessage({ type: '', text: '' });
                          try {
                            const response = await fetch('/api/admin/automation', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'budget-alerts' })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setMessage({ type: 'success', text: `Budget alerts triggered!` });
                            } else {
                              setMessage({ type: 'error', text: data.error });
                            }
                          } catch (error) {
                            setMessage({ type: 'error', text: 'Failed to trigger budget alerts' });
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs md:text-sm"
                      >
                        <Bell className="h-3 w-3 md:h-4 md:w-4" />
                        Trigger Budget Alerts
                      </button>

                      <button
                        onClick={async () => {
                          setMessage({ type: '', text: '' });
                          try {
                            const response = await fetch('/api/admin/automation', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'trigger-monthly-report' })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setMessage({ type: 'success', text: `Monthly report triggered!` });
                            } else {
                              setMessage({ type: 'error', text: data.error });
                            }
                          } catch (error) {
                            setMessage({ type: 'error', text: 'Failed to trigger monthly report' });
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm"
                      >
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                        Trigger Monthly Report
                      </button>

                      <button
                        onClick={async () => {
                          setMessage({ type: '', text: '' });
                          try {
                            const response = await fetch('/api/admin/automation', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'trigger-recurring-transaction' })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setMessage({ type: 'success', text: `Recurring transaction triggered!` });
                            } else {
                              setMessage({ type: 'error', text: data.error });
                            }
                          } catch (error) {
                            setMessage({ type: 'error', text: 'Failed to trigger recurring transaction' });
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs md:text-sm"
                      >
                        <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                        Trigger Recurring Transaction
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-base md:text-lg font-semibold text-navy-800">Security Settings</h3>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between p-3 md:p-4 border border-cyan-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-navy-800 text-sm md:text-base">Require Two-Factor Authentication</p>
                      <p className="text-xs md:text-sm text-navy-600">Enforce 2FA for all admin users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={getSettingValue('security', 'require2FA', true)}
                        onChange={(e) => handleSettingChange('security', 'require2FA', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 md:w-11 md:h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={getSettingValue('security', 'sessionTimeout', 30)}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                        min="5"
                        max="120"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        value={getSettingValue('security', 'maxLoginAttempts', 5)}
                        onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                        className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-base md:text-lg font-semibold text-navy-800">Notification Settings</h3>

                <div className="space-y-3 md:space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Email Notifications',
                      description: 'Send email alerts for important events'
                    },
                    {
                      key: 'securityAlerts',
                      label: 'Security Alerts',
                      description: 'Receive alerts for security events'
                    },
                    {
                      key: 'systemUpdates',
                      label: 'System Updates',
                      description: 'Notify about system updates and maintenance'
                    },
                    {
                      key: 'budgetAlerts',
                      label: 'Budget Alerts',
                      description: 'Send alerts when approaching budget limits'
                    }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 md:p-4 border border-cyan-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-navy-800 text-sm md:text-base">{item.label}</p>
                        <p className="text-xs md:text-sm text-navy-600">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                        <input
                          type="checkbox"
                          checked={getSettingValue('notifications', item.key, true)}
                          onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 md:w-11 md:h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-base md:text-lg font-semibold text-navy-800">Financial Settings</h3>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Default Currency
                    </label>
                    <select
                      value={getSettingValue('financial', 'defaultCurrency', 'ETB')}
                      onChange={(e) => handleSettingChange('financial', 'defaultCurrency', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                    >
                      <option value="ETB">ETB - Ethiopian Birr</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                    <p className="text-xs md:text-sm text-navy-600 mt-1">Primary currency for all financial transactions</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-base md:text-lg font-semibold text-navy-800">User Management Settings</h3>

                <div className="space-y-3 md:space-y-4">
                  {[
                    {
                      key: 'allowRegistrations',
                      label: 'Allow New Registrations',
                      description: 'Allow new users to sign up'
                    },
                    {
                      key: 'requireEmailVerification',
                      label: 'Require Email Verification',
                      description: 'Users must verify email before accessing system'
                    }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 md:p-4 border border-cyan-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-navy-800 text-sm md:text-base">{item.label}</p>
                        <p className="text-xs md:text-sm text-navy-600">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                        <input
                          type="checkbox"
                          checked={getSettingValue('users', item.key, true)}
                          onChange={(e) => handleSettingChange('users', item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 md:w-11 md:h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                      </label>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Default User Role
                    </label>
                    <select
                      value={getSettingValue('users', 'defaultUserRole', 'user')}
                      onChange={(e) => handleSettingChange('users', 'defaultUserRole', e.target.value)}
                      className="w-full px-3 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm md:text-base"
                    >
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Save and Cancel buttons */}
        <div className="flex justify-end gap-3 p-4 md:p-6 border-t border-cyan-200 bg-cyan-50/30">
          <button
            onClick={onClose}
            className="px-3 py-2 md:px-4 md:py-2 border border-cyan-200 text-navy-700 rounded-lg hover:bg-cyan-50 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-cyan-500 to-navy-500 text-white rounded-lg hover:from-cyan-600 hover:to-navy-600 transition-all disabled:opacity-50 text-sm md:text-base"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}