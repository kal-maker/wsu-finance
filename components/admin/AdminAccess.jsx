// components/admin/AdminAccess.jsx
'use client'

import { useUser } from '@clerk/nextjs'
import { Loader2, ShieldAlert, LogOut, Network } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminAccess({ 
  children, 
  fallbackPath = '/dashboard',
  showAdminHeader = true 
}) {
  const { user, isLoaded, signOut } = useUser()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!isLoaded) return

    const checkAccess = async () => {
      try {
        console.log('🔐 [CLIENT] Checking admin access for user:', user?.id);
        
        const response = await fetch('/api/admin/check-access')
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          // Get the response text to see what's actually being returned
          const text = await response.text()
          console.error('❌ [CLIENT] Non-JSON response:', text.substring(0, 200))
          throw new Error(`API returned ${response.status}: ${text.substring(0, 100)}...`)
        }
        
        const data = await response.json()
        
        console.log('🔐 [CLIENT] Admin check response:', data)
        
        if (data.success && data.isAdmin) {
          setUserRole(data.user?.role || 'admin')
          setIsChecking(false)
        } else {
          setUserRole(data.user?.role || 'user')
          setAccessDenied(true)
          console.log('🚫 [CLIENT] Admin access denied')
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push(fallbackPath)
          }, 3000)
        }

      } catch (error) {
        console.error('❌ [CLIENT] Error checking admin access:', error)
        setApiError(error.message)
        setAccessDenied(true)
        // Don't redirect immediately for API errors - let user see the error
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [user, isLoaded, router, fallbackPath])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleRetry = () => {
    setApiError(null)
    setAccessDenied(false)
    setIsChecking(true)
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-8 shadow-lg">
            {apiError ? (
              <Network className="h-16 w-16 text-red-500 mx-auto mb-4" />
            ) : (
              <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {apiError ? 'API Error' : 'Access Denied'}
            </h2>
            <p className="text-gray-600 mb-4">
              {apiError 
                ? `Could not verify access: ${apiError}`
                : userRole 
                  ? `Your role (${userRole}) doesn't have admin access.`
                  : 'Admin privileges required.'
              }
            </p>
            <div className="space-y-3">
              {userRole && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Role: {userRole}
                </Badge>
              )}
              {apiError ? (
                <Button 
                  onClick={handleRetry}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  Retry Check
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push(fallbackPath)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  Go to Dashboard
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
          {apiError && (
            <p className="text-sm text-red-500 mt-2">{apiError}</p>
          )}
        </div>
      </div>
    )
  }

  // If we get here, user is admin
  return <>{children}</>
}