import type { ReactNode } from 'react';

export default function AdminLayout({
  children,
  activity,
  analytics,
  modal,
}: {
  children: ReactNode;
  activity: ReactNode;
  analytics: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {activity}
      {analytics}
      {modal}
    </>
  );
}
