'use client';

import { useModalContext } from '@/shared/providers/modal-provider';

export function useModal() {
  return useModalContext();
}
