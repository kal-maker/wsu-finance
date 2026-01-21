const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRoles() {
    console.log('Updating mock user roles...');
    try {
        const result = await prisma.user.updateMany({
            where: {
                clerkUserId: {
                    startsWith: 'user_mock_'
                }
            },
            data: {
                role: 'user'
            }
        });
        console.log(`✅ Successfully updated ${result.count} mock users to the "user" role.`);
    } catch (error) {
        console.error('❌ Error updating roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateRoles();
