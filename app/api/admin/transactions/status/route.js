import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { transactionId, status } = await request.json();
    
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status }
    });
    
    return NextResponse.json({ 
      success: true,
      message: `Transaction status updated to ${status}`,
      transaction
    });
    
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}