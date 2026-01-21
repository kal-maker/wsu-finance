import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { currentUser } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get the currently logged-in user from Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data from request (optional fallbacks from Clerk)
    const { email, name, imageUrl } = await request.json();

    // Use data from request or fallback to Clerk data
    const userEmail = email || user.emailAddresses[0]?.emailAddress;
    const userName = name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    const userImage = imageUrl || user.imageUrl;

    // Create or update user in database
    const syncedUser = await prisma.user.upsert({
      where: { clerkUserId: user.id },
      update: {
        email: userEmail,
        name: userName,
        imageUrl: userImage,
      },
      create: {
        clerkUserId: user.id,
        email: userEmail,
        name: userName,
        imageUrl: userImage,
        role: 'user', // Default role for regular users
      },
    });

    console.log(`✅ Auto-synced user: ${syncedUser.name} (${syncedUser.email})`);

    return NextResponse.json({ 
      success: true,
      user: syncedUser
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync user'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}