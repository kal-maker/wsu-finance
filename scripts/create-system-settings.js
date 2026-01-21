// scripts/create-system-settings.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createSystemSettingsTable() {
  try {
    console.log('🔧 Creating system_settings table...')
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value JSON,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    console.log('✅ system_settings table created successfully!')
    
    // Create index
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key)`
    console.log('✅ Index created')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createSystemSettingsTable()