import axios from 'axios';
import { FileResponse, File as FileType } from '../types/file';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const fileService = {
  async uploadFile({ file, referenceId }: { file: File; referenceId?: string }): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);

    if (referenceId) {
      formData.append('id', referenceId);
    }
    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getFiles(name?: string, type?: string, startSize?: number, endSize?: number, startDate?: string, endDate?: string, page?: number, pageSize?: number): Promise<FileResponse> {
    const params: Record<string, string | number> = {};

    if (name) params.name = name;
    if (type) params.type = type;
    if (startSize) params.startSize = startSize;
    if (endSize) params.endSize = endSize;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if(page) params.page = page;
    if(pageSize) params.pageSize = pageSize;

    const response = await axios.get(`${API_URL}/files/`, {params});
    return response.data;
  },

  async getFilesByHash(file: File): Promise<{ exists: boolean; id?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/get_duplicate_file/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getmatchableFiles(query: string): Promise<string[]> {
    const response = await axios.get(`${API_URL}/files/get_files/`, {
      params: { q: query },
    });
    return response.data;
  },

  async getMimeTypes(): Promise<string[]>{
    const response = await axios.get(`${API_URL}/files/get_all_mime_type/`);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  },
}; 