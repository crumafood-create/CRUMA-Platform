'use client';

import {
  createContext,
  useContext,
} from 'react';

const ModalContext =
  createContext<any>(null);

export function ModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export function useModalContext() {
  return useContext(
    ModalContext
  );
}
