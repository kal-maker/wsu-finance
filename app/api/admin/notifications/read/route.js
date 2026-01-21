// app/api/admin/notifications/read/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();

    // Get user from database using clerkUserId
    const user = await db.user.findFirst({
      where: { clerkUserId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (notificationId) {
      // Mark single notification as read
      await db.notification.updateMany({
        where: {
          id: notificationId,
          OR: [
            { userId: null },
            { userId: user.id }
          ]
        },
        data: {
          read: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}