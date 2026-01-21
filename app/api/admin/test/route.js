import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic database operations
    const userCount = await db.user.count();
    console.log('User count:', userCount);
    
    const transactionCount = await db.transaction.count();
    console.log('Transaction count:', transactionCount);
    
    // Test if we can query transactions
    const recentTransactions = await db.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        account: { select: { name: true } }
      }
    });
    
    console.log('Recent transactions:', recentTransactions.length);

    return NextResponse.json({
      success: true,
      userCount,
      transactionCount,
      recentTransactions: recentTransactions.length,
      message: 'Database connection successful'
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: 'Database connection failed'
    }, { status: 500 });
  }
}