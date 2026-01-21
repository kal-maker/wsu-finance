import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    console.log('Fetching users with filters:', { search, role, status });

    const client = await clerkClient();

    // Get all users from Clerk
    let clerkUsers;
    try {
      clerkUsers = await client.users.getUserList({ limit: 100 });
      console.log(`Found ${clerkUsers.data.length} users in Clerk`);
    } catch (clerkError) {
      console.error('Error fetching users from Clerk:', clerkError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch users from Clerk',
          message: clerkError.message
        },
        { status: 500 }
      );
    }

    // Get all users from Prisma with their data
    let prismaUsers = [];
    try {
      prismaUsers = await prisma.user.findMany({
        include: {
          transactions: { select: { id: true } },
          accounts: { select: { id: true } },
          budgets: { select: { id: true } }
        }
      });
      console.log(`Found ${prismaUsers.length} users in Prisma`);
    } catch (prismaError) {
      console.error('Error fetching users from Prisma:', prismaError);
      // Continue with Clerk data only
    }

    // Combine Clerk and Prisma data
    const usersWithClerk = clerkUsers.data.map(clerkUser => {
      const prismaUser = prismaUsers.find(u => u.clerkUserId === clerkUser.id);

      const userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        clerkUser.username ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        'Unknown User';

      const userEmail = clerkUser.emailAddresses[0]?.emailAddress || 'No email';

      return {
        id: clerkUser.id,
        clerkUserId: clerkUser.id,
        name: userName,
        email: userEmail,
        image: clerkUser.imageUrl,
        joinDate: new Date(clerkUser.createdAt),
        lastActive: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : null,
        status: clerkUser.banned ? 'banned' : 'active',
        role: prismaUser?.role || 'user',
        transactionCount: prismaUser?.transactions?.length || 0,
        accountCount: prismaUser?.accounts?.length || 0,
        budgetCount: prismaUser?.budgets?.length || 0,
        prismaId: prismaUser?.id,
        hasPrismaRecord: !!prismaUser
      };
    });

    // Identify and format "Offline/Mock" Prisma users that are not in Clerk
    const mockUsers = prismaUsers
      .filter(pUser => !clerkUsers.data.some(cUser => cUser.id === pUser.clerkUserId))
      .map(pUser => ({
        id: pUser.clerkUserId,
        clerkUserId: pUser.clerkUserId,
        name: pUser.name || 'Mock User',
        email: pUser.email || 'No email',
        image: pUser.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pUser.clerkUserId}`,
        joinDate: pUser.createdAt,
        lastActive: pUser.updatedAt,
        status: 'active', // Mock users are always active for demo
        role: pUser.role || 'user',
        transactionCount: pUser.transactions?.length || 0,
        accountCount: pUser.accounts?.length || 0,
        budgetCount: pUser.budgets?.length || 0,
        prismaId: pUser.id,
        hasPrismaRecord: true,
        isMock: true
      }));

    // Combine both lists
    const users = [...usersWithClerk, ...mockUsers];

    // Apply filters
    let filteredUsers = users;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Status filter
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    console.log(`Returning ${filteredUsers.length} filtered users`);

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      total: filteredUsers.length
    });

  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        message: error.message
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}