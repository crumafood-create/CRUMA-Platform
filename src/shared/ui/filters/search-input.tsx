interface Props {

  placeholder?: string;
}

export function SearchInput({

  placeholder = 'Buscar...'

}: Props) {

  return (

    <input
      type="search"
      placeholder={placeholder}
      className="w-full rounded-xl border px-4 py-3"
    />
  );
}
