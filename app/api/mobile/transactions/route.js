
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const transactions = await db.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            include: { account: true }
        });

        // Serialize Decimal to Number
        const serializedTransactions = transactions.map(tx => ({
            ...tx,
            amount: Number(tx.amount)
        }));

        return NextResponse.json(serializedTransactions);

    } catch (error) {
        console.error('[MOBILE_API] Transactions error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
