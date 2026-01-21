import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId, status } = await request.json();

    console.log('Updating user status:', { userId, status });

    if (!userId || !status) {
      return NextResponse.json(
        { success: false, error: 'User ID and status are required' },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    
    // Verify user exists
    try {
      const user = await client.users.getUser(userId);
      console.log('Found user:', user.id);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found in Clerk',
          message: error.message 
        },
        { status: 404 }
      );
    }

    if (status === 'banned') {
      await client.users.banUser(userId);
      console.log('User banned successfully');
    } else if (status === 'active') {
      await client.users.unbanUser(userId);
      console.log('User activated successfully');
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Use "active" or "banned"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${status === 'banned' ? 'banned' : 'activated'} successfully`
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update user status',
        message: error.message,
        clerkError: error.errors?.[0]?.message || 'Unknown Clerk error'
      },
      { status: 500 }
    );
  }
}