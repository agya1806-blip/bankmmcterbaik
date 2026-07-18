"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';

const CHECK_INTERVAL = 60_000;
const INACTIVITY_LIMIT = 15 * 60 * 1000;

export function InactivityWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart'] as const;

    const handleActivity = () => {
      useSessionStore.getState().updateActivity();
    };

    events.forEach((event) => document.addEventListener(event, handleActivity));

    const interval = setInterval(() => {
      const { lastActivity, currentUser, logout } = useSessionStore.getState();
      if (currentUser && Date.now() - lastActivity > INACTIVITY_LIMIT) {
        logout();
        router.push('/login');
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => document.removeEventListener(event, handleActivity));
      clearInterval(interval);
    };
  }, [router]);

  return <div>{children}</div>;
}
