const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
    
    console.log('📊 Existing tables:')
    tables.forEach(table => {
      console.log(`   - ${table.name}`)
    })
    
    const requiredTables = ['backup_logs', 'maintenance_logs']
    const missingTables = requiredTables.filter(table => 
      !tables.some(t => t.name === table)
    )
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:', missingTables)
    } else {
      console.log('\n✅ All required tables exist!')
    }
    
  } catch (error) {
    console.error('Error checking tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()