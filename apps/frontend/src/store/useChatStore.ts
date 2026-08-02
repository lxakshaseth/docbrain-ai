import { create } from 'zustand';
import { IConversation, IMessage } from '@pdf-chatbot/shared';

interface ChatState {
  conversations: IConversation[];
  activeConversation: IConversation | null;
  messages: IMessage[];
  isStreaming: boolean;
  setConversations: (convs: IConversation[]) => void;
  setActiveConversation: (conv: IConversation | null) => void;
  setMessages: (messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;
  setIsStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isStreaming: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
