// app/api/admin/settings/backup/route.js
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request) {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin using your existing User model
    const dbUser = await db.user.findFirst({
      where: { clerkUserId: user.id },
      select: { role: true, name: true, id: true }
    })

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { action, frequency } = await request.json()
    const backupId = `backup_${Date.now()}`
    
    console.log('💾 [BACKUP] Starting backup by:', dbUser.name)

    // Log backup start using your existing SystemLog model
    await db.systemLog.create({
      data: {
        action: 'BACKUP_START',
        module: 'Backup',
        description: `Starting ${action === 'start' ? 'manual' : 'automatic'} backup`,
        level: 'INFO',
        userId: dbUser.id,
        metadata: {
          backupId: backupId,
          type: action === 'start' ? 'manual' : 'automatic',
          frequency: frequency
        }
      }
    })

    try {
      // Get all data for backup using your existing models
      const backupData = {
        timestamp: new Date().toISOString(),
        backupId: backupId,
        version: '1.0',
        data: {
          // Users data
          users: await db.user.findMany({
            select: {
              id: true,
              clerkUserId: true,
              email: true,
              name: true,
              imageUrl: true,
              role: true,
              createdAt: true,
              updatedAt: true
            }
          }),
          
          // Accounts data
          accounts: await db.account.findMany({
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }),
          
          // Transactions data
          transactions: await db.transaction.findMany({
            include: {
              user: {
                select: { name: true, email: true }
              },
              account: {
                select: { name: true, type: true }
              }
            },
            orderBy: { date: 'desc' },
            take: 10000 // Limit to prevent huge backups
          }),
          
          // Budgets data
          budgets: await db.budget.findMany({
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }),
          
          // System settings
          settings: await db.systemSettings.findMany(),
          
          // Recent system logs
          systemLogs: await db.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1000
          }),
          
          // Recent admin audit logs
          auditLogs: await db.adminAuditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1000,
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }),
          
          // Recent notifications
          notifications: await db.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1000,
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          })
        },
        statistics: {
          totalUsers: await db.user.count(),
          totalTransactions: await db.transaction.count(),
          totalAccounts: await db.account.count(),
          totalBudgets: await db.budget.count()
        }
      }

      // Create backups directory if it doesn't exist
      const backupsDir = join(process.cwd(), 'backups')
      await mkdir(backupsDir, { recursive: true })

      // Save backup to file
      const backupFilePath = join(backupsDir, `${backupId}.json`)
      await writeFile(backupFilePath, JSON.stringify(backupData, null, 2))

      // Calculate backup size
      const stats = await import('fs').then(fs => 
        fs.promises.stat(backupFilePath)
      )

      // Log backup success using your existing SystemLog model
      await db.systemLog.create({
        data: {
          action: 'BACKUP_SUCCESS',
          module: 'Backup',
          description: `Backup completed successfully. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          level: 'INFO',
          userId: dbUser.id,
          metadata: {
            backupId: backupId,
            size: stats.size,
            filePath: backupFilePath,
            recordCounts: backupData.statistics
          }
        }
      })

      // Log audit trail using your existing AdminAuditLog model
      await db.adminAuditLog.create({
        data: {
          action: 'CREATE_BACKUP',
          resource: 'Backup',
          resourceId: backupId,
          description: `Created backup with ${Object.values(backupData.statistics).reduce((a, b) => a + b, 0)} total records`,
          userId: dbUser.id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      })

      console.log('✅ [BACKUP] Backup completed successfully:', backupId)

      return NextResponse.json({
        success: true,
        message: 'Backup completed successfully',
        backupId: backupId,
        size: stats.size,
        timestamp: new Date().toISOString(),
        statistics: backupData.statistics,
        filePath: backupFilePath
      })

    } catch (backupError) {
      // Log backup failure using your existing SystemLog model
      await db.systemLog.create({
        data: {
          action: 'BACKUP_FAILED',
          module: 'Backup',
          description: `Backup failed: ${backupError.message}`,
          level: 'ERROR',
          userId: dbUser.id,
          metadata: {
            backupId: backupId,
            error: backupError.message,
            timestamp: new Date().toISOString()
          }
        }
      })

      console.error('❌ [BACKUP] Backup failed:', backupError)
      throw backupError
    }

  } catch (error) {
    console.error('❌ [BACKUP] Error during backup:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Backup failed: ' + error.message
    }, { status: 500 })
  }
}

// Get backup history using your existing SystemLog model
export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin using your existing User model
    const dbUser = await db.user.findFirst({
      where: { clerkUserId: user.id },
      select: { role: true }
    })

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    // Get backup logs from system logs
    const backupLogs = await db.systemLog.findMany({
      where: {
        action: {
          in: ['BACKUP_START', 'BACKUP_SUCCESS', 'BACKUP_FAILED']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // Transform logs into backup history format
    const backups = backupLogs.map(log => ({
      id: log.id,
      backupId: log.metadata?.backupId || `log_${log.id}`,
      type: log.metadata?.type || 'unknown',
      status: log.action === 'BACKUP_SUCCESS' ? 'success' : 
              log.action === 'BACKUP_FAILED' ? 'failed' : 'in_progress',
      size: log.metadata?.size || null,
      description: log.description,
      createdAt: log.createdAt,
      createdBy: log.user
    }))

    return NextResponse.json({
      success: true,
      backups: backups
    })

  } catch (error) {
    console.error('❌ [BACKUP] Error fetching backup history:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch backup history'
    }, { status: 500 })
  }
}