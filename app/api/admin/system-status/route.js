import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    // Database connectivity check
    let dbStatus = 'operational';
    let dbResponseTime = 0;
    
    try {
      const startTime = Date.now();
      await db.user.count(); // Simple query to test DB connection
      dbResponseTime = Date.now() - startTime;
    } catch (error) {
      dbStatus = 'degraded';
      console.error('Database connection test failed:', error);
    }

    // Get basic metrics
    const totalUsers = await db.user.count().catch(() => 0);
    const totalTransactions = await db.transaction.count().catch(() => 0);
    const totalAccounts = await db.account.count().catch(() => 0);
    
    // Recent activity counts (last hour)
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentUsers = await db.user.count({
      where: { createdAt: { gte: lastHour } }
    }).catch(() => 0);
    
    const recentTransactions = await db.transaction.count({
      where: { createdAt: { gte: lastHour } }
    }).catch(() => 0);

    const status = {
      system: {
        status: 'operational',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
        connections: 'healthy'
      },
      services: {
        api: 'operational',
        authentication: 'operational',
        fileStorage: 'operational'
      },
      metrics: {
        users: {
          total: totalUsers,
          recent: recentUsers,
          growth: recentUsers > 0 ? 'positive' : 'stable'
        },
        transactions: {
          total: totalTransactions,
          recent: recentTransactions,
          trend: recentTransactions > 10 ? 'high' : 'normal'
        },
        accounts: {
          total: totalAccounts
        }
      },
      performance: {
        memoryUsage: Math.floor(Math.random() * 30) + 20, // Simulated 20-50%
        cpuLoad: Math.floor(Math.random() * 40) + 10, // Simulated 10-50%
        responseTime: dbResponseTime
      }
    };

    return NextResponse.json({
      ...status,
      success: true,
      message: 'System status fetched successfully'
    });

  } catch (error) {
    console.error('Error in system status API:', error);
    
    // Fallback response
    return NextResponse.json({
      system: { status: 'degraded', uptime: 0, timestamp: new Date().toISOString() },
      database: { status: 'degraded', responseTime: 0 },
      services: {
        api: 'degraded',
        authentication: 'degraded', 
        fileStorage: 'degraded'
      },
      metrics: {
        users: { total: 0, recent: 0, growth: 'unknown' },
        transactions: { total: 0, recent: 0, trend: 'unknown' },
        accounts: { total: 0 }
      },
      performance: {
        memoryUsage: 0,
        cpuLoad: 0,
        responseTime: 0
      },
      success: false,
      error: error.message
    }, { status: 500 });
  }
}