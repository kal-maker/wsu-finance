// app/admin/layout.js
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { checkUser } from '@/lib/checkUser';
import AdminClientLayout from '@/components/admin/AdminClientLayout';
import AdminAccess from '@/components/admin/AdminAccess';

export default async function AdminLayout({ children }) {
  const user = await currentUser();

  if (!user) {
    console.log('🚫 No user - redirecting to sign-in');
    redirect('/sign-in');
  }

  // Ensure user exists in database
  const dbUser = await checkUser();

  if (!dbUser) {
    console.log('🚫 Failed to create/find user in database');
    redirect('/dashboard');
  }

  console.log('🔐 Admin layout check:', {
    user: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    isAdmin: dbUser.role === 'admin'
  });

  if (dbUser.role !== 'admin') {
    console.log('🚫 Non-admin user attempted admin access:', {
      user: dbUser.name,
      role: dbUser.role
    });
    redirect('/dashboard');
  }

  console.log('✅ Admin access granted:', dbUser.name);

  return (
    <AdminClientLayout>
      <AdminAccess showAdminHeader={false}>
        {children}
      </AdminAccess>
    </AdminClientLayout>
  );
}