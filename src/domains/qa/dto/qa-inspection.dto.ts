import type { QAInspection }
from '../types/qa-inspection.type';

export function qaInspectionDto(
  data: any
): QAInspection {

  return {

    id: data.id,

    batch_code:
      data.batch_code,

    status:
      data.status,

    inspector_name:
      data.inspector_name,

    notes:
      data.notes,

    created_at:
      data.created_at
  };
}
