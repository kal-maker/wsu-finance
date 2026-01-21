
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[MOBILE_API] Fetching dashboard for user:', userId);

    // 1. Get User (ensure exists)
    let user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true
      }
    });

    if (!user) {
      console.log('[MOBILE_API] User not found, creating...');
      user = await db.user.create({
        data: {
          clerkUserId: userId,
          email: `user-${userId}@example.com`,
          role: 'user',
          accounts: {
            create: [{ name: 'Main Account', type: 'CURRENT', balance: 0, isDefault: true }]
          }
        },
        include: { accounts: true }
      });
    }

    // 2. Get Transactions
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 5
    });

    // 3. Serialize Data (Decimal to Number)
    const accounts = user.accounts.map(acc => ({
      ...acc,
      balance: Number(acc.balance)
    }));

    const recentTransactions = transactions.map(tx => ({
      ...tx,
      amount: Number(tx.amount)
    }));

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Monthly Spend (Expense only)
    const currentMonth = new Date().getMonth();
    const monthlySpend = recentTransactions
      .filter(t => new Date(t.date).getMonth() === currentMonth && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      totalBalance,
      monthlySpend,
      recentTransactions,
      accounts
    });

  } catch (error) {
    console.error('[MOBILE_API] Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
