import type { HTMLAttributes, ReactNode } from 'react';

type MenuProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode };
type TriggerProps = { children?: ReactNode; asChild?: boolean };
type ContentProps = MenuProps & { align?: 'start' | 'center' | 'end' };

export function DropdownMenu({ children, ...props }: MenuProps) {
  return <div {...props}>{children}</div>;
}

export function DropdownMenuTrigger({ children }: TriggerProps) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children, align = 'start', ...props }: ContentProps) {
  return <div data-align={align} {...props}>{children}</div>;
}

export function DropdownMenuItem(props: MenuProps) {
  return <div role="menuitem" tabIndex={0} {...props} />;
}

export function DropdownMenuLabel(props: MenuProps) {
  return <div {...props} />;
}

export function DropdownMenuSeparator(props: HTMLAttributes<HTMLHRElement>) {
  return <hr {...props} />;
}

export function DropdownMenuGroup(props: MenuProps) {
  return <div role="group" {...props} />;
}

export function DropdownMenuPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuSub(props: MenuProps) {
  return <div {...props} />;
}

export function DropdownMenuSubTrigger(props: MenuProps) {
  return <div {...props} />;
}

export function DropdownMenuSubContent(props: MenuProps) {
  return <div {...props} />;
}
