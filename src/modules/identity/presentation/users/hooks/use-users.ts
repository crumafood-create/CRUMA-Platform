'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  ListUsersUseCase,
} from '@/modules/identity/application/use-cases';

export function useUsers() {
  const query = useQuery({
    queryKey: ['users'],

    queryFn: async () => {
      const useCase =
        new ListUsersUseCase();

      return useCase.execute();
    },
  });

  return useMemo(
    () => ({
      users: query.data ?? [],

      isLoading:
        query.isLoading,

      isFetching:
        query.isFetching,

      refetch:
        query.refetch,
    }),
    [query]
  );
}
