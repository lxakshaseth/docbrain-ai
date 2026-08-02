import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { IDocument } from '@pdf-chatbot/shared';

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
    refetchInterval: 4000, // Poll every 4 seconds for vector ingestion status
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
