export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  file_hash: string;
  reference_id: string;
} 

export interface FileResponse{
  result: File[],
  count: number,
  total_pages: number,
  current_page: number,
  page_size: number,
  has_next: boolean,
  has_previous: boolean
}