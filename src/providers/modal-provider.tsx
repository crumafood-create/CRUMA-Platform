'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

type ModalContent = ReactNode | null;

interface ModalContextValue {
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  modalContent: ModalContent;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [modalContent, setModalContent] = useState<ModalContent>(null);

  const openModal = (content: ReactNode) => {
    setModalContent(content);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <ModalContext.Provider
      value={{
        openModal,
        closeModal,
        modalContent,
      }}
    >
      {children}

      {modalContent}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }

  return context;
}
