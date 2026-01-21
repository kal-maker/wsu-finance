import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    console.log('Fetching transactions from database...');

    const transactions = await prisma.transaction.findMany({
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            clerkUserId: true
          }
        },
        account: {
          select: {
            name: true,
            type: true
          }
        }
      }
    });

    const total = await prisma.transaction.count();

    console.log(`Found ${transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch transactions',
        message: error.message 
      },
      { status: 500 }
    );
  }
}