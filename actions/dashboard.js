// actions/dashboard.js
"use server";

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server'; // CHANGED: Use auth instead of currentUser

// Helper function to serialize Decimal objects
function serializeAccount(account) {
  return {
    ...account,
    balance: account.balance?.toNumber ? account.balance.toNumber() : Number(account.balance),
    transactions: account.transactions?.map(transaction => ({
      ...transaction,
      amount: transaction.amount?.toNumber ? transaction.amount.toNumber() : Number(transaction.amount)
    })) || []
  };
}

// Create user in database if they don't exist
async function ensureUserInDatabase(clerkUserId, userEmail = null) {
  try {
    console.log('🔍 Checking if user exists in database:', clerkUserId);
    
    // First try to find existing user
    let dbUser = await db.user.findUnique({
      where: { clerkUserId: clerkUserId },
      include: {
        accounts: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    if (!dbUser) {
      console.log('🔄 User not found in database, creating...');
      
      // For new users, we need to get user info from Clerk API
      // Since we only have userId from auth(), we need to fetch user details
      // You might need to use Clerk's backend API to get user details
      
      const userName = 'New User'; // Default name
      
      // All new users start as 'user' - admins can promote them later via user management
      dbUser = await db.user.create({
        data: {
          clerkUserId: clerkUserId,
          email: userEmail || `user-${clerkUserId}@example.com`, // Use provided email or generate one
          name: userName,
          role: 'user', // Default role for all new users
          accounts: {
            create: [
              {
                name: 'Main Account',
                type: 'CURRENT',
                balance: 0,
                isDefault: true,
              }
            ]
          }
        },
        include: {
          accounts: {
            include: {
              transactions: {
                orderBy: { date: 'desc' },
                take: 5
              }
            }
          }
        }
      });

      console.log('✅ User created in database:', dbUser.id, dbUser.email, 'Role:', dbUser.role);
      
      // Create notification for new user (admins will see this)
      await db.notification.create({
        data: {
          type: 'info',
          title: '👤 New User Registered',
          message: `${dbUser.name} (${dbUser.email}) joined WSU Finance`,
          priority: 'medium',
          read: false
        }
      });
      
      console.log('✅ Notification created for new user');
    }

    return dbUser;
  } catch (error) {
    console.error('❌ Error ensuring user in database:', error);
    throw error;
  }
}

// Helper to get user email from Clerk (optional - if you need more user details)
async function getUserDetailsFromClerk(userId) {
  // You can use Clerk's backend API if you need more user details
  // For now, return null or implement if needed
  return null;
}

export async function getUserAccounts() {
  try {
    // CHANGED: Use auth() instead of currentUser()
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    console.log('🔍 [DASHBOARD] Getting accounts for user:', userId);

    // Ensure user exists in database
    const dbUser = await ensureUserInDatabase(userId);

    // Serialize accounts before returning
    const serializedAccounts = dbUser.accounts.map(serializeAccount);
    console.log(`✅ Returning ${serializedAccounts.length} accounts for user: ${dbUser.name} (${dbUser.role})`);
    
    return serializedAccounts;

  } catch (error) {
    console.error('❌ [DASHBOARD] Error in getUserAccounts:', error);
    throw error;
  }
}

export async function getDashboardData() {
  try {
    // CHANGED: Use auth() instead of currentUser()
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    console.log('🔍 [DASHBOARD] Getting transactions for user:', userId);

    // Ensure user exists in database
    const dbUser = await ensureUserInDatabase(userId);

    // Get all user transactions
    const transactions = await db.transaction.findMany({
      where: { userId: dbUser.id },
      orderBy: { date: 'desc' },
      include: {
        account: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('✅ [DASHBOARD] Found transactions:', transactions.length);

    // Serialize transactions
    const serializedTransactions = transactions.map(transaction => ({
      ...transaction,
      amount: transaction.amount?.toNumber ? transaction.amount.toNumber() : Number(transaction.amount)
    }));

    return serializedTransactions;

  } catch (error) {
    console.error('❌ [DASHBOARD] Error in getDashboardData:', error);
    throw error;
  }
}

export async function createAccount(data) {
  try {
    // CHANGED: Use auth() instead of currentUser()
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Ensure user exists in database
    const dbUser = await ensureUserInDatabase(userId);

    // Check if this should be default account
    const existingAccounts = await db.account.findMany({
      where: { userId: dbUser.id }
    });

    const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

    // If making this default, unset other defaults
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { 
          userId: dbUser.id,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }

    // Create the account
    const account = await db.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: parseFloat(data.balance) || 0,
        isDefault: shouldBeDefault,
        userId: dbUser.id,
      }
    });

    // Serialize the account before returning
    const serializedAccount = serializeAccount(account);
    
    return { success: true, data: serializedAccount };
  } catch (error) {
    console.error('❌ [DASHBOARD] Error in createAccount:', error);
    throw error;
  }
}

// Add a function to get user profile if you need full user details
export async function getUserProfile() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        accounts: true
      }
    });

    if (!dbUser) {
      // Create user if doesn't exist
      return await ensureUserInDatabase(userId);
    }

    return dbUser;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    throw error;
  }
}