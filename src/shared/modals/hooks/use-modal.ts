'use client';

import { useModalContext } from '@/app/providers/modal-provider';

export function useModal() {
  return useModalContext();
}
