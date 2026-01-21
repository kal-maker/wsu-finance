const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const firstNames = ['Abebe', 'Kebede', 'Almaz', 'Mulugeta', 'Tigist', 'Dawit', 'Selam', 'Bereket', 'Hanna', 'Yohannes', 'Lemlem', 'Girma', 'Aster', 'Solomon', 'Etenesh', 'Haile', 'Zewdu', 'Belaynesh', 'Tekle', 'Meseret'];
const lastNames = ['Bekele', 'Gebre', 'Tadesse', 'Wolde', 'Assefa', 'Negash', 'Tesfaye', 'Alemu', 'Berhanu', 'Desta', 'Kassaye', 'Mengistu', 'Shiferaw', 'Worku', 'Zewdie', 'Ayele', 'Balcha', 'Feyissa', 'Guta', 'Megersa'];
const roles = ['user', 'user', 'user', 'user', 'admin'];
const categories = ['shopping', 'food', 'transportation', 'entertainment', 'utilities', 'health', 'housing'];

async function seedUsers() {
    console.log('🚀 Starting to seed 100 sample users...');

    try {
        for (let i = 1; i <= 100; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@example.com`;
            const clerkUserId = `user_mock_${Math.random().toString(36).substring(2, 11)}`;

            const user = await prisma.user.create({
                data: {
                    clerkUserId,
                    name,
                    email,
                    role: 'user',
                    imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${clerkUserId}`,
                }
            });

            // Create a default account for the user
            const account = await prisma.account.create({
                data: {
                    name: 'Main Checking',
                    type: 'CURRENT',
                    balance: Math.floor(Math.random() * 5000) + 1000,
                    userId: user.id,
                    isDefault: true
                }
            });

            // Create some random transactions
            const numTransactions = Math.floor(Math.random() * 10) + 5;
            for (let j = 0; j < numTransactions; j++) {
                await prisma.transaction.create({
                    data: {
                        type: Math.random() > 0.3 ? 'EXPENSE' : 'INCOME',
                        amount: Math.floor(Math.random() * 500) + 10,
                        description: `Sample transaction ${j + 1}`,
                        date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
                        category: categories[Math.floor(Math.random() * categories.length)],
                        status: 'COMPLETED',
                        userId: user.id,
                        accountId: account.id
                    }
                });
            }

            if (i % 10 === 0) {
                console.log(`✅ Created ${i} users...`);
            }
        }

        console.log('✨ Successfully seeded 100 sample users with accounts and transactions!');

        const count = await prisma.user.count();
        console.log(`Total users in database: ${count}`);

    } catch (error) {
        console.error('❌ Error seeding users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsers();
