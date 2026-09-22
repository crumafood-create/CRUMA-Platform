'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

type ModalContextValue = {
  closeAll: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

export function useModalContext(): ModalContextValue | null {
  return useContext(ModalContext);
}
