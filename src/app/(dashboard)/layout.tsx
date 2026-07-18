"use client";

import AppShell from "@/components/layout/app-shell";
import { InactivityWrapper } from "@/components/layout/inactivity-wrapper";
import NotificationChecker from "@/components/layout/notification-checker";
import RecurringScheduler from "@/components/layout/recurring-scheduler";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InactivityWrapper>
      <AppShell>
        <NotificationChecker />
        <RecurringScheduler />
        {children}
      </AppShell>
    </InactivityWrapper>
  );
}
