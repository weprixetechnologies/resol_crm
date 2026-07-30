'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'admin') {
    return null; // or a loader
  }

  return <>{children}</>;
}
