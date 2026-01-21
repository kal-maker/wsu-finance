// app/api/admin/notifications/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    console.log('🎯 NOTIFICATIONS API CALLED - Route is working!');
    
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Fetching notifications for Clerk user:', userId);

    // Get user from database - or create if doesn't exist (for admin)
    let user = await db.user.findFirst({
      where: { clerkUserId: userId }
    });

    if (!user) {
      console.log('⚠️ User not found in database, creating admin user...');
      
      // Get Clerk user details to create the user
      const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
        }
      }).then(res => res.json());
      
      user = await db.user.create({
        data: {
          clerkUserId: userId,
          email: clerkUser.email_addresses?.[0]?.email_address || 'admin@wsufinance.com',
          name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 'Admin User',
          imageUrl: clerkUser.image_url,
          role: 'admin'
        }
      });
      
      console.log('✅ Created admin user in database:', user.id);
    }

    console.log('👤 Using user:', user.id, user.name, user.role);

    // Get ALL notifications (since admin should see everything)
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await db.notification.count({
      where: { read: false }
    });

    console.log('✅ Found notifications:', notifications.length, 'Unread:', unreadCount);

    // Format response
    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      priority: notif.priority,
      read: notif.read,
      createdAt: notif.createdAt.toISOString(),
      time: formatTimeAgo(notif.createdAt)
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('❌ Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications: ' + error.message },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date) {
  try {
    const now = new Date();
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date received:', date);
      return 'Recently';
    }
    
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Recently';
  }
}