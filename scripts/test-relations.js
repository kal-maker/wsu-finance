// test-relations.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testRelations() {
  try {
    console.log('🧪 Testing relations...')
    
    // Test if we can query users with relations
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        backupLogs: { select: { id: true } },
        maintenanceLogs: { select: { id: true } }
      }
    })
    
    console.log('✅ Relations test passed!')
    console.log('User:', users[0])
    
  } catch (error) {
    console.error('❌ Relations test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testRelations()