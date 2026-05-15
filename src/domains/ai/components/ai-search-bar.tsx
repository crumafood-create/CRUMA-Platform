'use client';

import { useState }
from 'react';

import Link
from 'next/link';

import { searchAction }
from '../actions/search.action';

import { Input }
from '@/shared/forms/input';

import { Button }
from '@/shared/ui/button';

export function AiSearchBar() {

  const [results, setResults] =
    useState<any[]>([]);

  async function handleSearch(
    formData: FormData
  ) {

    const data =
      await searchAction(formData);

    setResults(data);
  }

  return (

    <div className="space-y-6">

      <form
        action={handleSearch}
        className="flex gap-4"
      >

        <Input
          name="query"
          placeholder="Buscar productos..."
        />

        <Button type="submit">

          Buscar

        </Button>

      </form>

      <div className="space-y-4">

        {results.map(result => (

          <Link
            key={result.id}
            href={`/producto/${result.slug}`}
            className="block rounded-xl border p-4"
          >

            <h3 className="font-semibold">

              {result.name}

            </h3>

            <p className="text-sm text-gray-500">

              {result.description}

            </p>

          </Link>
        ))}

      </div>

    </div>
  );
}
