import { Clerk } from '@clerk/clerk-sdk-node';

console.log('🔑 Testing Clerk connection...');
console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
console.log('CLERK_SECRET_KEY starts with:', process.env.CLERK_SECRET_KEY?.substring(0, 10));

try {
  const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
  const users = await clerk.users.getUserList();
  console.log(`✅ Success! Found ${users.length} users in Clerk`);
  console.log('First user:', users[0]?.id, users[0]?.emailAddresses[0]?.emailAddress);
} catch (error) {
  console.error('❌ Clerk error:', error.message);
}