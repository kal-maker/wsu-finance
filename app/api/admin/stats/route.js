import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const client = await clerkClient();
    
    // Get counts from Prisma
    const [
      totalUsers,
      totalTransactions,
      totalIncome,
      totalExpenses,
      activeBudgets,
      totalAccounts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true }
      }),
      prisma.budget.count(),
      prisma.account.count()
    ]);

    // Get active users from Clerk (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const clerkUsers = await client.users.getUserList();
    const activeUsers = clerkUsers.data.filter(user => 
      user.lastSignInAt && new Date(user.lastSignInAt) > thirtyDaysAgo
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalTransactions,
        totalIncome: totalIncome._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        activeBudgets,
        totalAccounts,
        netFlow: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch statistics',
        message: error.message 
      },
      { status: 500 }
    );
  }
}