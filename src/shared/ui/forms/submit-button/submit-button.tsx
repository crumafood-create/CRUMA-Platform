'use client';

import { useFormStatus }
from 'react-dom';

interface Props {

  label: string;

  loadingLabel?: string;
}

export function SubmitButton({

  label,
  loadingLabel = 'Guardando...'

}: Props) {

  const { pending } =
    useFormStatus();

  return (

    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
    >

      {pending
        ? loadingLabel
        : label}

    </button>
  );
}
