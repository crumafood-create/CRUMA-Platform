import type { ReactNode } from 'react';

export default function AdminLayout({
  children,
  activity,
  analytics,
  modal,
}: {
  children: React.ReactNode;
  activity: React.ReactNode;
  analytics: React.ReactNode;
  modal: React.ReactNode;
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
