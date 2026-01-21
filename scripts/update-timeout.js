const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const securitySetting = await prisma.systemSettings.findUnique({
            where: { key: 'security' }
        });

        if (securitySetting) {
            console.log('Found existing security settings:', JSON.stringify(securitySetting.value));
            const updatedValue = {
                ...securitySetting.value,
                sessionTimeout: 5
            };

            await prisma.systemSettings.update({
                where: { key: 'security' },
                data: { value: updatedValue }
            });

            console.log('✅ Successfully updated database sessionTimeout to 5 minutes.');
        } else {
            console.log('ℹ️ No existing security settings found in database. Using code defaults.');
        }
    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
