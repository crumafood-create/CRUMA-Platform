interface Props {

  colSpan: number;

  message?: string;
}

export function TableEmpty({

  colSpan,
  message = 'No hay registros'

}: Props) {

  return (

    <tr>

      <td
        colSpan={colSpan}
        className="p-10 text-center text-gray-500"
      >

        {message}

      </td>

    </tr>
  );
}
