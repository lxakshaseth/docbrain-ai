import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import type { IConversation, IMessage } from '@pdf-chatbot/shared';

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
    staleTime: 1000 * 60 * 5, // 5 min cache
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
    staleTime: 1000 * 30, // 30 sec cache
    refetchInterval: (query) => {
      const messages = query.state.data;
      const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;
      // Continuously poll every 1.2s IF user is waiting for assistant or streaming flag is active
      if (isStreaming || (lastMsg && lastMsg.sender === 'user')) {
        return 1200;
      }
      return false;
    },
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

export const useDeleteConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetchApi(`/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete conversation session');
      }
      return conversationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

