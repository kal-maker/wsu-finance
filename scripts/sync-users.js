const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncAllUsers() {
  try {
    console.log('Starting user sync...');
    
    // Fetch users from your API endpoint (using built-in fetch in Node 18+)
    const response = await fetch('http://localhost:3000/api/admin/users');
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch users from API');
    }
    
    console.log(`Found ${data.users.length} users in Clerk via API`);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const clerkUser of data.users) {
      try {
        // Check if user already exists in local database
        const existingUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkUser.id }
        });

        if (!existingUser) {
          // Create user in local database
          const newUser = await prisma.user.create({
            data: {
              clerkUserId: clerkUser.id,
              email: clerkUser.email,
              name: clerkUser.name,
              imageUrl: clerkUser.image,
            }
          });
          console.log(`✅ Synced user: ${newUser.email}`);
          syncedCount++;
        } else {
          console.log(`⚠️ Already exists: ${existingUser.email}`);
        }
      } catch (userError) {
        console.error(`❌ Error syncing user ${clerkUser.id}:`, userError.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Sync completed!`);
    console.log(`✅ Successfully synced: ${syncedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    
    // Show final count
    const finalCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Make sure your dev server is running, then run the sync
syncAllUsers();