// hooks/use-admin.js
'use client';

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAdmin() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/check-access');
        const data = await response.json();
        
        if (data.success && data.isAdmin) {
          setIsAdmin(true);
        } else {
          // Redirect non-admins to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, isLoaded, router]);

  return { isAdmin, loading };
}