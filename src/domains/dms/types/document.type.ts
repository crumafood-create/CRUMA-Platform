export interface DocumentFile {

  id: string;

  title: string;

  category: string;

  file_path: string;

  mime_type: string | null;

  uploaded_by: string | null;

  created_at: string;
}

