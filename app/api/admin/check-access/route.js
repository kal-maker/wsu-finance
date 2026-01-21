// app/api/admin/check-access/route.js
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        isAdmin: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Check if user is admin in database
    const dbUser = await db.user.findFirst({
      where: { clerkUserId: user.id },
      select: { role: true, name: true, email: true }
    })

    console.log('🔐 [API] Admin check for user:', dbUser?.name, 'Role:', dbUser?.role)

    const isAdmin = dbUser && dbUser.role === 'admin'

    return NextResponse.json({
      success: true,
      isAdmin: isAdmin,
      user: dbUser ? { 
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email
      } : null
    })

  } catch (error) {
    console.error('❌ [API] Error checking admin access:', error)
    return NextResponse.json({
      success: false,
      isAdmin: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}