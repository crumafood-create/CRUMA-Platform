'use client';

import type { ReactNode } from 'react';

interface BaseModalProps {
  children: ReactNode;
  onClose: () => void;
}

export function BaseModal({
  children,
  onClose,
}: BaseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
