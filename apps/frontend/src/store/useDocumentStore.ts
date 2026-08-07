import { create } from 'zustand';
import type { IDocument } from '@pdf-chatbot/shared';

interface DocumentState {
  documents: IDocument[];
  activeDocument: IDocument | null;
  isLoading: boolean;
  setDocuments: (docs: IDocument[]) => void;
  setActiveDocument: (doc: IDocument | null) => void;
  addDocument: (doc: IDocument) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  activeDocument: null,
  isLoading: false,

  setDocuments: (documents) => set({ documents }),
  setActiveDocument: (activeDocument) => set({ activeDocument }),
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  setLoading: (isLoading) => set({ isLoading }),
}));
