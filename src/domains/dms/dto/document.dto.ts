import type { DocumentFile }
from '../types/document.type';

export function documentDto(
  data: any
): DocumentFile {

  return {

    id: data.id,

    title:
      data.title,

    category:
      data.category,

    file_path:
      data.file_path,

    mime_type:
      data.mime_type,

    uploaded_by:
      data.uploaded_by,

    created_at:
      data.created_at
  };
}

