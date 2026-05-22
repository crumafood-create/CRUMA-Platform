'use client';

import { useModalContext } from '@/providers/modal-provider';

export function useModal() {
  return useModalContext();
}
