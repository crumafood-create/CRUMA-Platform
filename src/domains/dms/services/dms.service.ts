import { getDocuments }
from '../repositories/dms.repository';

export async function fetchDocuments() {

  return getDocuments();
}
