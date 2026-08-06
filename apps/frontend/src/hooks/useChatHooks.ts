import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { IConversation, IMessage } from '@pdf-chatbot/shared';

export const useConversationsQuery = () => {
  const { token } = useAuthStore();
  return useQuery({
    queryKey: ['conversations', token],
    queryFn: async () => {
      const res = await fetchApi<IConversation[]>('/chat/conversations');
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch conversations');
      }
      return res.data;
    },
    enabled: !!token,
  });
};

export const useMessagesQuery = (conversationId: string | null) => {
  const { token } = useAuthStore();
  const isStreaming = useChatStore((state) => state.isStreaming);

  return useQuery({
    queryKey: ['messages', conversationId, token],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await fetchApi<IMessage[]>(`/chat/conversations/${conversationId}/messages`);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch messages');
      }
      return res.data;
    },
    enabled: !!conversationId && !!token,
    refetchInterval: isStreaming ? 1000 : false, // Auto-poll every 1s while streaming until assistant response lands
    refetchOnWindowFocus: false,
  });
};

export const useSendMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, query, conversationId }: { documentId: string; query: string; conversationId?: string }) => {
      const res = await fetchApi<any>('/chat', {
        method: 'POST',
        body: JSON.stringify({ documentId, query, conversationId }),
      });
      if (!res.success || !res.data) {
        const errorDetails = res.error?.details ? `: ${JSON.stringify(res.error.details)}` : '';
        throw new Error((res.message || 'Failed to send message') + errorDetails);
      }
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

