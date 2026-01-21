import { db } from './prisma'

export class SystemLogger {
  static async log(action, description, options = {}) {
    try {
      const log = await db.systemLog.create({
        data: {
          action,
          module: options.module || 'SYSTEM',
          description,
          level: options.level || 'INFO',
          userId: options.userId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          resourceId: options.resourceId,
          metadata: options.metadata
        }
      })
      
      console.log(`[${log.level}] ${action}: ${description}`)
      return log
    } catch (error) {
      console.error('Failed to write system log:', error)
      // Don't throw - logging shouldn't break the application
    }
  }

  // Convenience methods
  static async userRegistered(userId, userData) {
    return this.log(
      'USER_REGISTERED',
      `New user registered: ${userData.email}`,
      {
        userId,
        module: 'AUTH',
        metadata: { email: userData.email, name: userData.name }
      }
    )
  }

  static async userLogin(userId, ipAddress, userAgent) {
    return this.log(
      'USER_LOGIN',
      'User logged in successfully',
      {
        userId,
        module: 'AUTH',
        ipAddress,
        userAgent
      }
    )
  }

  static async transactionCreated(userId, transactionId, amount, type) {
    return this.log(
      'TRANSACTION_CREATED',
      `${type} transaction created: ETB ${amount}`,
      {
        userId,
        module: 'TRANSACTIONS',
        resourceId: transactionId,
        metadata: { amount: amount.toString(), type }
      }
    )
  }

  static async accountCreated(userId, accountId, accountName) {
    return this.log(
      'ACCOUNT_CREATED',
      `Account created: ${accountName}`,
      {
        userId,
        module: 'ACCOUNTS',
        resourceId: accountId,
        metadata: { accountName }
      }
    )
  }

  static async adminAction(userId, action, details) {
    return this.log(
      'ADMIN_ACTION',
      `Admin action: ${action}`,
      {
        userId,
        module: 'ADMIN',
        metadata: { action, details }
      }
    )
  }

  static async error(module, description, error, userId = null) {
    return this.log(
      'SYSTEM_ERROR',
      description,
      {
        userId,
        module,
        level: 'ERROR',
        metadata: { 
          errorMessage: error.message,
          stack: error.stack
        }
      }
    )
  }
}