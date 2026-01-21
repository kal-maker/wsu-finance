// create-missing-tables.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing tables...')
    
    // Create backup_logs table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS backup_logs (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        backupId TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        size INTEGER,
        description TEXT,
        createdBy TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      )
    `
    console.log('✅ Created backup_logs table')
    
    // Create maintenance_logs table  
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        enabled BOOLEAN NOT NULL,
        message TEXT,
        startedBy TEXT NOT NULL,
        startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        endedAt DATETIME,
        endedBy TEXT,
        FOREIGN KEY (startedBy) REFERENCES users(id) ON DELETE CASCADE
      )
    `
    console.log('✅ Created maintenance_logs table')
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_backup_logs_createdBy ON backup_logs(createdBy)`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_backup_logs_createdAt ON backup_logs(createdAt)`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_maintenance_logs_startedBy ON maintenance_logs(startedBy)`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_maintenance_logs_startedAt ON maintenance_logs(startedAt)`
    
    console.log('✅ Created indexes')
    
  } catch (error) {
    console.error('❌ Error creating tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingTables()