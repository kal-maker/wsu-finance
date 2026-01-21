// app/api/admin/debug-role/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 401 });
    }

    // Get user from database
    const user = await db.user.findFirst({
      where: { clerkUserId: userId },
      select: { id: true, email: true, name: true, role: true }
    });

    return NextResponse.json({
      userId,
      userInDatabase: user,
      isAdmin: user?.role === 'admin',
      accessGranted: user?.role === 'admin'
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}