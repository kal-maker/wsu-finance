import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma'; // Change from prisma to db
import { clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    console.log('Starting activities API call...');
    
    const client = await clerkClient();
    console.log('Clerk client initialized');
    
    // Get recent transactions (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log('Fetching recent transactions...');
    const recentTransactions = await db.transaction.findMany({ // Change to db
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        account: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    console.log(`Found ${recentTransactions.length} recent transactions`);

    // Get new user registrations (last 24 hours)
    console.log('Fetching new users...');
    const newUsers = await db.user.findMany({ // Change to db
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    console.log(`Found ${newUsers.length} new users`);

    // Get Clerk user data
    console.log('Fetching Clerk users...');
    const clerkUsers = await client.users.getUserList({
      limit: 20
    });
    console.log(`Found ${clerkUsers.data.length} Clerk users`);

    // Format activities
    const activities = [];

    // Add new user registrations
    newUsers.forEach(user => {
      const clerkUser = clerkUsers.data.find(cu => cu.id === user.clerkUserId);
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'New User Registration',
        description: `${user.name || clerkUser?.firstName || 'User'} registered in the system`,
        user: user.name || clerkUser?.firstName || 'New User',
        time: user.createdAt,
        status: 'completed',
        createdAt: user.createdAt
      });
    });

    // Add recent transactions
    recentTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      
      activities.push({
        id: `transaction-${transaction.id}`,
        type: 'transaction',
        title: `${transaction.type === 'INCOME' ? 'Income' : 'Expense'} Transaction`,
        description: `${transaction.description || 'Transaction'} - ${transaction.account?.name || 'Account'}`,
        amount: amount,
        user: transaction.user?.name || 'User',
        time: transaction.createdAt,
        status: 'completed',
        createdAt: transaction.createdAt
      });

      // Add alert for large expenses
      if (transaction.type === 'EXPENSE' && amount > 10000) {
        activities.push({
          id: `alert-${transaction.id}`,
          type: 'alert',
          title: 'Large Expense Detected',
          description: `Large expense of ETB ${amount.toLocaleString()} by ${transaction.user?.name || 'user'}`,
          user: transaction.user?.name || 'User',
          time: transaction.createdAt,
          status: 'warning',
          createdAt: transaction.createdAt
        });
      }
    });

    // Add a system activity if no other activities
    if (activities.length === 0) {
      activities.push({
        id: 'system-1',
        type: 'system',
        title: 'System Active',
        description: 'Financial system is running normally',
        time: new Date(),
        status: 'completed',
        createdAt: new Date()
      });
    }

    // Sort all activities by date (newest first)
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Take only the most recent activities
    const recentActivities = activities.slice(0, 15);

    console.log(`Returning ${recentActivities.length} activities`);
    
    return NextResponse.json({ 
      activities: recentActivities,
      success: true 
    });
  } catch (error) {
    console.error('Error in activities API:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch activities',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}