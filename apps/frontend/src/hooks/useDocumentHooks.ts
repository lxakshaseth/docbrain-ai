import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, API_BASE_URL } from '../lib/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { useDocumentStore } from '../store/useDocumentStore';
import type { IDocument, IDocumentSummary, IStudySet } from '@pdf-chatbot/shared';

export const useDocumentsQuery = () => {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['documents', token],
    queryFn: async () => {
      const res = await fetchApi<IDocument[]>('/documents');
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch documents');
      }
      return res.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchInterval: (query) => {
      const docs = query.state.data;
      const hasPending = docs?.some((d) => d.status === 'pending' || (d.status as string) === 'processing');
      return hasPending ? 3000 : false;
    },
  });
};

export const useDocumentSummaryQuery = (documentId: string | null, enabled = true) => {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['document-summary', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error('No document ID');
      const res = await fetchApi<IDocumentSummary>(`/documents/${documentId}/summary`);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load document summary');
      }
      return res.data;
    },
    enabled: !!token && !!documentId && enabled,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes for instant re-opening
  });
};

export const useStudySetQuery = (documentId: string | null, enabled = true) => {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['study-set', documentId],
    queryFn: async () => {
      if (!documentId) throw new Error('No document ID');
      const res = await fetchApi<IStudySet>(`/documents/${documentId}/study-set`);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to load study set');
      }
      return res.data;
    },
    enabled: !!token && !!documentId && enabled,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes for instant re-opening
  });
};

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();
  const { addDocument, setActiveDocument, setUploadingState } = useDocumentStore();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (file: File) => {
      setUploadingState(true, file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.message || 'Failed to upload PDF document');
      }

      return data.data as IDocument;
    },
    onSuccess: (uploadedDoc) => {
      addDocument(uploadedDoc);
      setActiveDocument(uploadedDoc);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onSettled: () => {
      setUploadingState(false, null);
    },
  });
};

export const useReprocessDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetchApi<IDocument>(`/documents/${documentId}/reprocess`, {
        method: 'POST',
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Reprocessing document failed');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetchApi(`/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.message || 'Deleting document failed');
      }
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};


