import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await db.user.findFirst({
      where: {
        clerkUserId: user.id,
        role: 'admin'
      }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { enabled, message } = await request.json();

    // Update maintenance mode setting in database
    await db.systemSettings.upsert({
      where: { key: 'system' },
      update: {
        value: {
          maintenanceMode: enabled,
          systemName: 'WSU Finance Platform',
          systemEmail: 'admin@wsu.edu',
          autoBackup: true,
          backupFrequency: 'daily',
          timezone: 'Africa/Addis_Ababa',
          dateFormat: 'DD/MM/YYYY'
        }
      },
      create: {
        key: 'system',
        value: {
          maintenanceMode: enabled,
          systemName: 'WSU Finance Platform',
          systemEmail: 'admin@wsu.edu',
          autoBackup: true,
          backupFrequency: 'daily',
          timezone: 'Africa/Addis_Ababa',
          dateFormat: 'DD/MM/YYYY'
        }
      }
    });

    // Log maintenance mode change
    await db.systemLog.create({
      data: {
        action: enabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        module: 'System',
        description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        level: 'WARN',
        userId: dbUser.id,
        metadata: {
          enabled,
          message: message || 'System maintenance in progress',
          timestamp: new Date().toISOString()
        }
      }
    });

    // Log audit trail
    await db.adminAuditLog.create({
      data: {
        action: enabled ? 'ENABLE_MAINTENANCE' : 'DISABLE_MAINTENANCE',
        resource: 'System',
        description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
        userId: dbUser.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    console.log(`🔧 [MAINTENANCE] Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'} by ${dbUser.name}`);

    return NextResponse.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      maintenanceMode: enabled,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [MAINTENANCE] Error updating maintenance mode:', error);

    // Log the error
    await db.systemLog.create({
      data: {
        action: 'MAINTENANCE_ERROR',
        module: 'System',
        description: 'Failed to update maintenance mode',
        level: 'ERROR',
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    });

    return NextResponse.json(
      { success: false, error: 'Failed to update maintenance mode' },
      { status: 500 }
    );
  }
}