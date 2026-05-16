import { getQAInspections }
from '../repositories/qa.repository';

export async function fetchQAInspections() {

  return getQAInspections();
}
