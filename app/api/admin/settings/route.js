import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';

// Updated default settings structure (simplified)
const defaultSettings = {
  system: {
    systemName: 'WSU Finance Platform',
    systemEmail: 'admin@wsu.edu',
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily'
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
    // Removed: largeTransactionThreshold, lowBalanceAlert
  },
  financial: {
    defaultCurrency: 'ETB'
    // Removed: transactionLimit, autoApproveTransactions, requireApprovalAbove, taxRate
  },
  users: {
    allowRegistrations: true,
    requireEmailVerification: true,
    defaultUserRole: 'user'
  }
};

export async function GET() {
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

    // Get all settings from database
    const settings = await db.systemSettings.findMany();

    // Convert to object format
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Merge with default settings (database settings override defaults)
    const mergedSettings = { ...defaultSettings };
    Object.keys(settingsMap).forEach(key => {
      if (mergedSettings[key]) {
        mergedSettings[key] = { ...mergedSettings[key], ...settingsMap[key] };
      } else {
        mergedSettings[key] = settingsMap[key];
      }
    });

    return NextResponse.json({
      success: true,
      settings: mergedSettings
    });

  } catch (error) {
    console.error('❌ [SETTINGS] Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let dbUser;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    dbUser = await db.user.findFirst({
      where: {
        clerkUserId: userId,
        role: 'admin'
      }
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const settings = await request.json();
    console.log('📝 [SETTINGS API] Saving settings categories:', Object.keys(settings));

    // Save each category as a separate setting
    for (const [category, values] of Object.entries(settings)) {
      await db.systemSettings.upsert({
        where: { key: category },
        update: { value: values },
        create: { key: category, value: values }
      });
    }

    console.log('✅ [SETTINGS API] Settings saved successfully');

    // Log the setting change - WITHOUT metadata field
    await db.adminAuditLog.create({
      data: {
        action: 'UPDATE_SETTINGS',
        resource: 'System Settings',
        description: `Updated system configuration: ${Object.keys(settings).join(', ')}`,
        userId: dbUser.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
        // Removed: metadata field
      }
    });

    // Log system activity - WITHOUT metadata field
    await db.systemLog.create({
      data: {
        action: 'SETTINGS_UPDATE',
        module: 'Admin Settings',
        description: `System settings updated by ${dbUser.name}. Categories: ${Object.keys(settings).join(', ')}`,
        level: 'INFO',
        userId: dbUser.id
        // Removed: metadata field
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });

  } catch (error) {
    console.error('❌ [SETTINGS] Error saving settings:', error);

    // Log the error - WITHOUT metadata field
    await db.systemLog.create({
      data: {
        action: 'SETTINGS_UPDATE_ERROR',
        module: 'Admin Settings',
        description: `Failed to update system settings: ${error.message}`,
        level: 'ERROR',
        userId: dbUser?.id || null
        // Removed: metadata field
      }
    });

    return NextResponse.json(
      { success: false, error: 'Failed to save settings: ' + error.message },
      { status: 500 }
    );
  }
}