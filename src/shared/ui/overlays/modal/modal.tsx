'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import { Button } from '@/shared/ui/primitives/button';
import { cn } from '@/shared/ui/utils/cn';

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlay?: boolean;
};

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
} satisfies Record<NonNullable<ModalProps['size']>, string>;

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusable = () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    (focusable()[0] ?? dialogRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 cursor-default bg-black/50"
        aria-hidden="true"
        onClick={() => closeOnOverlay && onOpenChange(false)}
      />
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl border border-brand-gray-25 bg-white shadow-xl',
          sizes[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-brand-gray-25 p-6">
          <div>
            <h2 id={titleId} className="text-xl font-black text-brand-black">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-brand-gray-75">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar modal"
            onClick={() => onOpenChange(false)}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </header>
        <div className="p-6">{children}</div>
        {footer ? (
          <footer className="border-t border-brand-gray-25 p-6">{footer}</footer>
        ) : null}
      </section>
    </div>
  );
}
