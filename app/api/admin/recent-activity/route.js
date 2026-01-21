// app/api/admin/recent-activity/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET(request) {
  try {
    console.log('Recent Activity API called - Full version');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 8;

    // Get recent transactions from database
    const recentTransactions = await db.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
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
      }
    });

    // Get recent user registrations
    const recentUsers = await db.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true
      }
    });

    // Get recent accounts created
    const recentAccounts = await db.account.findMany({
      take: Math.floor(limit/2),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Combine all activities
    const activities = [];

    // Add user registrations
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'USER_SIGNUP',
        title: 'New User Registered',
        description: `${user.name || 'New user'} signed up`,
        user: user.name,
        email: user.email,
        role: user.role,
        timestamp: user.createdAt,
        icon: 'USER',
        color: 'green'
      });
    });

    // Add account creations
    recentAccounts.forEach(account => {
      activities.push({
        id: `account-${account.id}`,
        type: 'ACCOUNT_CREATED',
        title: 'New Account Created',
        description: `${account.user?.name || 'User'} created ${account.name} account`,
        user: account.user?.name,
        accountName: account.name,
        accountType: account.type,
        timestamp: account.createdAt,
        icon: 'SYSTEM',
        color: 'blue'
      });
    });

    // Add transactions
    recentTransactions.forEach(transaction => {
      activities.push({
        id: `transaction-${transaction.id}`,
        type: 'TRANSACTION',
        title: transaction.type === 'INCOME' ? 'Income Recorded' : 'Expense Recorded',
        description: transaction.description || `${transaction.type} transaction in ${transaction.account.name}`,
        amount: parseFloat(transaction.amount),
        category: transaction.category,
        user: transaction.user?.name,
        account: transaction.account?.name,
        timestamp: transaction.createdAt,
        icon: transaction.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        color: transaction.type === 'INCOME' ? 'blue' : 'orange'
      });
    });

    // Add system status event
    activities.push({
      id: 'system-status',
      type: 'SYSTEM',
      title: 'System Online',
      description: 'Admin dashboard is running',
      timestamp: new Date().toISOString(),
      icon: 'SYSTEM',
      color: 'purple'
    });

    // Sort all activities by timestamp and take the most recent
    const recentActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    console.log(`Returning ${recentActivities.length} activities from database`);

    return NextResponse.json({ 
      activities: recentActivities,
      stats: {
        users: recentUsers.length,
        transactions: recentTransactions.length,
        accounts: recentAccounts.length
      },
      success: true,
      message: 'Recent activities fetched successfully'
    });

  } catch (error) {
    console.error('Error in recent activity API:', error);
    
    // Fallback data that still shows the structure
    const fallbackActivities = [
      {
        id: 'fallback-1',
        type: 'SYSTEM',
        title: 'System Online',
        description: 'Admin dashboard is running',
        timestamp: new Date().toISOString(),
        icon: 'SYSTEM',
        color: 'blue'
      }
    ];

    return NextResponse.json({
      activities: fallbackActivities,
      success: false,
      error: error.message,
      message: 'Using fallback data due to database error'
    });
  }
}