// lib/notification-service.js
import { db } from './prisma';

export class NotificationService {
  static async createSystemNotification({
    type = 'info',
    title,
    message,
    priority = 'medium',
    relatedId = null,
    relatedType = null
  }) {
    try {
      return await db.notification.create({
        data: {
          type,
          title,
          message,
          priority,
          relatedId,
          relatedType,
          userId: null // System notification
        }
      });
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  static async createUserNotification({
    userId,
    type = 'info',
    title,
    message,
    priority = 'medium',
    relatedId = null,
    relatedType = null
  }) {
    try {
      return await db.notification.create({
        data: {
          type,
          title,
          message,
          priority,
          relatedId,
          relatedType,
          userId
        }
      });
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  // Automated notification triggers
  static async triggerNewUserAlert(user) {
    await this.createSystemNotification({
      type: 'info',
      title: 'New User Registered',
      message: `${user.name} just signed up for the platform`,
      priority: 'medium',
      relatedId: user.id,
      relatedType: 'user'
    });
  }

  static async triggerSystemHealthAlert(message, isCritical = false) {
    await this.createSystemNotification({
      type: isCritical ? 'error' : 'warning',
      title: 'System Health Alert',
      message: message,
      priority: isCritical ? 'high' : 'medium',
      relatedType: 'system'
    });
  }

  // Total system metrics notification
  static async triggerTotalMetricsUpdate() {
    try {
      const totalUsers = await db.user.count();
      const totalTransactions = await db.transaction.count();
      const totalAccounts = await db.account.count();
      
      await this.createSystemNotification({
        type: 'info',
        title: 'System Metrics Update',
        message: `Total: ${totalUsers} users, ${totalTransactions} transactions, ${totalAccounts} accounts`,
        priority: 'low',
        relatedType: 'metrics'
      });
    } catch (error) {
      console.error('Error creating total metrics notification:', error);
    }
  }
}