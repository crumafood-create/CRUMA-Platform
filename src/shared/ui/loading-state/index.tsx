'use client';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = 'Cargando...',
}: LoadingStateProps) {
  return <div>{message}</div>;
}
