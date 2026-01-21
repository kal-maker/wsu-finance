// app/api/admin/notifications/read-all/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database using clerkUserId
    const user = await db.user.findFirst({
      where: { clerkUserId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark all user's notifications as read
    await db.notification.updateMany({
      where: {
        OR: [
          { userId: null, read: false },
          { userId: user.id, read: false }
        ]
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}