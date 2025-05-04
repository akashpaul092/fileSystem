import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fileService } from '../services/fileService';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';


export const FileList: React.FC = () => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    name: '',
    type: '',
    startSize: 0,
    endSize: 0,
    startDate: '',
    endDate: '',
  });
  const [tempFilters, setTempFilters] = useState(filters);



  // Query for fetching files
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files', filters],
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [string, typeof filters];
      
      return fileService.getFiles(
        params.name,
        params.type,
        params.startSize,
        params.endSize,
        params.startDate,
        params.endDate
      );
    },
    enabled: true
  });

  const handleSelectFile = (file: string) => {
    setInput(file);
    setSuggestions([]);
    setFilters(prev => ({ ...prev, name: file }));
  };

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length >= 3) {
        const results = await fileService.getmatchableFiles(query);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 300),
    []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    fetchSuggestions(value);
  };

  // Mutation for deleting files
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // Mutation for downloading files
  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setFilters(tempFilters); // triggers react-query re-fetch
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Failed to load files. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>
      {!files || files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a file
          </p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <div className="bg-gray-100 p-5 mb-5 rounded-lg shadow-sm">
          <div className="flex justify-end items-center mb-5 relative" ref={containerRef}>
            <div className="w-72 relative">
              <input
                className="rounded-xl border border-gray-300 px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Search files..."
                value={input}
                onChange={handleChange}
              />

              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                  {suggestions.map((file, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer truncate"
                      onClick={() => handleSelectFile(file)}
                    >
                      {file}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
            
            <div className=''>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <label className="block text-gray-700 font-medium mb-2">File Type</label>
                  <select
                    id="fileType"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={handleFilterChange}
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="txt">TXT</option>
                  </select>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                  <label className="block text-gray-700 font-medium mb-2">File Size</label>
                  <div className="mt-2 flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600">Minimum file Size(KB)</label>
                      <input
                        type="number"
                        id="minFileSize"
                        className="mt-2 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleFilterChange}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600">Maximun file Size(KB)</label>
                      <input
                        type="number"
                        id="maxFileSize"
                        className="mt-2 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                  <label className="block text-gray-700 font-medium mb-2">Upload Date</label>
                  <div className="mt-2 flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600">Start Date</label>
                      <input
                        type="date"
                        id="startDate"
                        className="mt-2 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleFilterChange}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600">End Date</label>
                      <input
                        type="date"
                        id="endDate"
                        className="mt-2 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button 
              className='bg-primary-600 hover:bg-primary-700 px-5 py-3 rounded-full mt-5 font-bold text-white'
              onClick={applyFilters}
              >Apply Filter</button>
            </div>
          </div>

          <ul className="-my-5 divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename}
                    </p>
                    <p>{file.reference_id ? (
                          <strong>reference hash : </strong>
                        ) : (
                          <strong>hash : </strong>
                        )}
                        ( { file.file_hash } )
                    </p>
                    {file.reference_id ?
                      (<p><strong>Storage saved : {(file.size / 1024).toFixed(2)} KB </strong></p>) :
                      ('') 
                    }
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file.file, file.original_filename)}
                      disabled={downloadMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 