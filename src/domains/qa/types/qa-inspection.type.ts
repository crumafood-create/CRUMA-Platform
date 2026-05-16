export interface QAInspection {

  id: string;

  batch_code: string;

  status: string;

  inspector_name: string | null;

  notes: string | null;

  created_at: string;
}

