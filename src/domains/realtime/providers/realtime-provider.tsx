'use client';

import type { ReactNode }
from 'react';

interface Props {

  children: ReactNode;
}

export function RealtimeProvider({
  children
}: Props) {

  return children;
}
