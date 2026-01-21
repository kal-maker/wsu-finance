import { db } from './prisma';

export class RealNotificationService {
  
  // Check for new users and create notifications
  static async checkNewUsers() {
    try {
      // Find users created in the last 5 minutes that don't have notifications yet
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const newUsers = await db.user.findMany({
        where: {
          createdAt: {
            gte: fiveMinutesAgo
          },
          // Check if notification already exists for this user
          notifications: {
            none: {
              type: 'user_created'
            }
          }
        }
      });

      for (const user of newUsers) {
        await db.notification.create({
          data: {
            type: 'user_created',
            title: '👤 New User Registered',
            message: `${user.name || user.email} joined the system`,
            userId: user.id,
            metadata: {
              email: user.email,
              registrationTime: user.createdAt
            }
          }
        });
        console.log(`✅ Created notification for new user: ${user.email}`);
      }

      return newUsers.length;
    } catch (error) {
      console.error('Error checking new users:', error);
      return 0;
    }
  }

  // Check for new transactions and create notifications
  static async checkNewTransactions() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const newTransactions = await db.transaction.findMany({
        where: {
          createdAt: {
            gte: fiveMinutesAgo
          },
          // Check if notification already exists for this transaction
          notifications: {
            none: {
              type: {
                in: ['transaction_created', 'large_transaction']
              }
            }
          }
        },
        include: {
          user: true
        }
      });

      let notificationCount = 0;

      for (const transaction of newTransactions) {
        const isLarge = transaction.amount > 5000;
        
        await db.notification.create({
          data: {
            type: isLarge ? 'large_transaction' : 'transaction_created',
            title: isLarge ? '💳 Large Transaction' : '💳 New Transaction',
            message: `${transaction.user.name} ${transaction.type === 'INCOME' ? 'deposited' : 'withdrew'} ETB ${transaction.amount.toLocaleString()}`,
            userId: transaction.userId,
            metadata: {
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category,
              transactionId: transaction.id
            }
          }
        });
        notificationCount++;
        console.log(`✅ Created notification for transaction: ETB ${transaction.amount}`);
      }

      return notificationCount;
    } catch (error) {
      console.error('Error checking new transactions:', error);
      return 0;
    }
  // System health and statistics
  static async checkSystemHealth() {
    try {
      // Check user growth in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const newUsersCount = await db.user.count({
        where: {
          createdAt: {
            gte: oneHourAgo
          }
        }
      });

      if (newUsersCount > 0) {
        // Check if we already have a growth notification for this period
        const existingNotification = await db.notification.findFirst({
          where: {
            type: 'user_growth',
            createdAt: {
              gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
            }
          }
        });

        if (!existingNotification) {
          await db.notification.create({
            data: {
              type: 'user_growth',
              title: '📈 User Growth',
              message: `${newUsersCount} new user(s) registered in the last hour`,
              metadata: {
                userCount: newUsersCount,
                period: '1 hour'
              }
            }
          });
        }
      }

      // Create total metrics notification (runs every health check)
      const existingMetricsNotification = await db.notification.findFirst({
        where: {
          type: 'system_metrics',
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });

      if (!existingMetricsNotification) {
        const totalUsers = await db.user.count();
        const totalTransactions = await db.transaction.count();
        const totalAccounts = await db.account.count();
        
        await db.notification.create({
          data: {
            type: 'system_metrics',
            title: '📊 System Overview',
            message: `Platform now has ${totalUsers} users, ${totalTransactions} transactions, and ${totalAccounts} accounts`,
            priority: 'low',
            metadata: {
              totalUsers,
              totalTransactions,
              totalAccounts
            }
          }
        });
      }

    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  // Check for any system events
  static async checkAllEvents() {
    try {
      const newUsers = await this.checkNewUsers();
      // Removed transaction notifications as requested
      await this.checkSystemHealth();

      console.log(`🔍 Checked events: ${newUsers} new users`);

      return {
        newUsers
      };
    } catch (error) {
      console.error('Error checking all events:', error);
      return { newUsers: 0 };
    }
  }
}