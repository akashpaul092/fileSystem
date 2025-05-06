import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileService } from '../services/fileService'; 

interface MimeTypeContextType {
  mimeTypes: string[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchMimeTypes: () => void;
}

const MimeTypeContext = createContext<MimeTypeContextType | undefined>(undefined);

export const useMimeType = (): MimeTypeContextType => {
  const context = useContext(MimeTypeContext);
  if (!context) {
    throw new Error('useMimeType must be used within a MimeTypeProvider');
  }
  return context;
};

export const MimeTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: mimeTypes, isLoading: isQueryLoading, error: mimeTypeError, refetch } = useQuery<string[], Error>({
    queryKey: ['mimeTypes'],
    queryFn: fileService.getMimeTypes, 
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

  const refetchMimeTypes = refetch;

  return (
    <MimeTypeContext.Provider value={{ mimeTypes, isLoading: isQueryLoading, error: mimeTypeError, refetchMimeTypes }}>
      {children}
    </MimeTypeContext.Provider>
  );
};
