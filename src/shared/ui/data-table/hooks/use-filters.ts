import { useState } from 'react';

export function useFilters() {
  const [search, setSearch] =
    useState('');

  return {
    search,
    setSearch,
  };
}
