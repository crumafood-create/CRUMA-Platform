export type TableState =
  | 'loading'
  | 'empty'
  | 'success';

export function getTableState(
  isLoading: boolean,
  rowsCount: number
): TableState {
  if (isLoading) {
    return 'loading';
  }

  if (rowsCount === 0) {
    return 'empty';
  }

  return 'success';
}
