'use client';

import { useMutation } from '@tanstack/react-query';

import {
  CreateUserUseCase,
  UpdateUserUseCase,
} from '@/modules/identity/application/use-cases';

import {
  UserDto,
} from '@/modules/identity/schemas';

interface Props {
  userId?: string;
}

export function useUserForm({
  userId,
}: Props = {}) {
  const mutation =
    useMutation({
      mutationFn: async (
        values: UserDto
      ) => {
        if (userId) {
          const useCase =
            new UpdateUserUseCase();

          return useCase.execute(
            values
          );
        }

        const useCase =
          new CreateUserUseCase();

        return useCase.execute(
          values
        );
      },
    });

  return {
    submit:
      mutation.mutateAsync,

    isLoading:
      mutation.isPending,

    error:
      mutation.error,
  };
}
