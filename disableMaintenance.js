const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const existing = await db.systemSettings.findUnique({ where: { key: 'system' } });
    const newValue = { ...(existing?.value || {}), maintenanceMode: false };

    const res = await db.systemSettings.upsert({
      where: { key: 'system' },
      update: { value: newValue },
      create: { key: 'system', value: newValue }
    });

    console.log('Maintenance mode disabled. New system settings:', res.value);
  } catch (err) {
    console.error('Failed to disable maintenance mode:', err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
})();
