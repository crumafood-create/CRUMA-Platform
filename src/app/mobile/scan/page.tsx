'use client';

import { useState } from 'react';

import { Scanner }
  from '@yudiel/react-qr-scanner';

export default function ScanPage() {
  const [
    value,
    setValue,
  ] = useState('');

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Escanear
      </h1>

      <div className="overflow-hidden rounded-2xl border">
        <Scanner
          onScan={(
            result,
          ) => {
            if (
              !result.length
            ) {
              return;
            }

            setValue(
              result[0]
                .rawValue,
            );
          }}
        />
      </div>

      <div className="rounded-2xl border p-6">
        <div className="text-sm text-gray-500">
          Resultado
        </div>

        <div className="mt-2 break-all text-lg font-semibold">
          {value ||
            'Escanea un código'}
        </div>
      </div>
    </main>
  );
}
