import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId, status } = await request.json();
    
    const client = await clerkClient();
    
    if (status === 'banned') {
      await client.users.banUser(userId);
    } else {
      await client.users.unbanUser(userId);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `User ${status === 'banned' ? 'banned' : 'activated'}`
    });
    
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}