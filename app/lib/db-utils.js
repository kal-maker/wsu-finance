// lib/db-utils.js
import { db } from './prisma'

export async function getSystemSettings() {
  const settings = await db.systemSettings.findMany()
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})
}

export async function updateSystemSetting(key, value) {
  return await db.systemSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}

export async function createAuditLog(logData) {
  return await db.adminAuditLog.create({
    data: logData
  })
}

export async function getUserStats() {
  const totalUsers = await db.user.count()
  const activeUsers = await db.user.count({
    where: { status: 'active' }
  })
  const bannedUsers = await db.user.count({
    where: { status: 'banned' }
  })
  const adminUsers = await db.user.count({
    where: { role: 'admin' }
  })

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    adminUsers
  }
}

export async function getFinancialStats(timeRange = '30d') {
  const now = new Date()
  let startDate = new Date()

  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7)
      break
    case '30d':
      startDate.setDate(now.getDate() - 30)
      break
    case '90d':
      startDate.setDate(now.getDate() - 90)
      break
    default:
      startDate.setDate(now.getDate() - 30)
  }

  const [incomeResult, expenseResult, transactionCount] = await Promise.all([
    db.transaction.aggregate({
      where: {
        type: 'INCOME',
        date: { gte: startDate }
      },
      _sum: { amount: true }
    }),
    db.transaction.aggregate({
      where: {
        type: 'EXPENSE',
        date: { gte: startDate }
      },
      _sum: { amount: true }
    }),
    db.transaction.count({
      where: {
        date: { gte: startDate }
      }
    })
  ])

  return {
    totalIncome: incomeResult._sum.amount || 0,
    totalExpenses: expenseResult._sum.amount || 0,
    netFlow: (incomeResult._sum.amount || 0) - (expenseResult._sum.amount || 0),
    transactionCount
  }
}