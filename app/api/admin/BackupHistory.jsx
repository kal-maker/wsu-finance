// components/admin/BackupHistory.jsx
'use client'

import { useState, useEffect } from 'react'
import { Download, RefreshCw, CheckCircle, XCircle, Clock, Database } from 'lucide-react'

export default function BackupHistory() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/admin/settings/backup')
      const data = await response.json()
      
      if (data.success) {
        setBackups(data.backups || [])
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
  }

  const formatBackupType = (type) => {
    switch (type) {
      case 'manual':
        return 'Manual Backup'
      case 'automatic':
        return 'Automatic Backup'
      default:
        return 'Backup'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-navy-800">Recent Backups</h4>
        <button
          onClick={fetchBackups}
          className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {backups.length === 0 ? (
          <p className="text-center text-navy-600 py-4">No backups found</p>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-3 border border-cyan-200 rounded-lg bg-white hover:bg-cyan-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(backup.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-800">
                    {formatBackupType(backup.type)}
                  </p>
                  <p className="text-xs text-navy-600">
                    {new Date(backup.createdAt).toLocaleString()}
                  </p>
                  {backup.description && (
                    <p className="text-xs text-navy-500 mt-1">{backup.description}</p>
                  )}
                  {backup.createdBy && (
                    <p className="text-xs text-navy-400 mt-1">
                      By: {backup.createdBy.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-navy-700">
                  {formatFileSize(backup.size)}
                </p>
                <p className={`text-xs capitalize ${
                  backup.status === 'success' ? 'text-green-600' :
                  backup.status === 'failed' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {backup.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}