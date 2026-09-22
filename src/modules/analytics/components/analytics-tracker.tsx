'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { trackAnalyticsPageView } from '@/modules/analytics/application/analytics-event-action';

const SESSION_KEY = 'cruma_analytics_session';

function sessionId(): string {
  const current = window.sessionStorage.getItem(SESSION_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export function AnalyticsTracker({ area }: { area: 'admin' | 'mobile' }) {
  const pathname = usePathname();

  useEffect(() => {
    void trackAnalyticsPageView({ area, page: pathname, sessionId: sessionId() });
  }, [area, pathname]);

  return null;
}
