'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/email/analytics');
  }, [router]);

  return null;
}
