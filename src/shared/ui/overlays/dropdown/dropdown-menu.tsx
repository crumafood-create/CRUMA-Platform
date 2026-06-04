import type { ReactNode } from 'react';

export function DropdownMenu({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children?: React.ReactNode;
  asChild?: boolean;
}) {
  return <>{children}</>;
}

export function DropdownMenuContent({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
}

export function DropdownMenuItem({
  children,
}: {
  children: ReactNode;
}) {
  return <div>{children}</div>;
                                    }
