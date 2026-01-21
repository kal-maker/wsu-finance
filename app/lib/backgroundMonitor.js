import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { RealNotificationService } from '@/lib/realNotificationService';

export async function GET(request) {
  try {
    // First, check for any new events that need notifications
    await RealNotificationService.checkAllEvents();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    const unreadCount = await db.notification.count({
      where: { read: false }
    });

    console.log(`📢 Serving ${notifications.length} notifications, ${unreadCount} unread`);

    return NextResponse.json({
      notifications: notifications.map(notif => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        timestamp: notif.createdAt,
        user: notif.user
      })),
      unreadCount,
      success: true
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      notifications: [],
      unreadCount: 0,
      success: false 
    }, { status: 500 });
  }
}

// POST - Update notification status
export async function POST(request) {
  try {
    const { notificationId, action } = await request.json();
    
    if (action === 'markAllRead') {
      await db.notification.updateMany({
        where: { read: false },
        data: { read: true }
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'All notifications marked as read'
      });
    }
    
    if (action === 'markRead' && notificationId) {
      await db.notification.update({
        where: { id: notificationId },
        data: { read: true }
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Notification marked as read'
      });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Invalid action or notificationId'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}