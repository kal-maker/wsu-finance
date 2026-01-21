import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, role } = await request.json();

    console.log('Updating user role:', { userId, role });

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    // Find user by clerkUserId and update role
    const updatedUser = await prisma.user.update({
      where: { clerkUserId: userId },
      data: { role }
    });

    console.log('Successfully updated user role:', updatedUser);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role updated to ${role}`
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    
    // Handle specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { 
          success: false,
          error: 'User not found in database',
          message: 'Please make sure the user exists in the database'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update user role',
        message: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}