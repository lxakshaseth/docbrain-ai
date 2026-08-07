// Core Shared Domain Interfaces & API Contracts

export type UserRole = 'user' | 'admin';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IMindNode {
  id: string;
  label: string;
  category?: string;
}

export interface IMindEdge {
  from: string;
  to: string;
  label?: string;
}

export interface IDocumentSummary {
  executiveSummary: string;
  keyTakeaways: string[];
  entities: string[];
  mindMap: {
    nodes: IMindNode[];
    edges: IMindEdge[];
  };
}

export interface IQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface IFlashcard {
  id: string;
  front: string;
  back: string;
  topic?: string;
}

export interface IStudySet {
  documentId: string;
  quizzes: IQuizQuestion[];
  flashcards: IFlashcard[];
  audioUrl?: string;
}

export interface IComparisonMatrixRow {
  feature: string;
  [docId: string]: string;
}

export interface IComparisonResult {
  summary: string;
  headers: { docId: string; title: string }[];
  rows: IComparisonMatrixRow[];
  markdownMatrix: string;
}

export interface IDocument {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  errorReason?: string;
  chunkCount: number;
  vectorCollectionId: string;
  isPublicShare?: boolean;
  shareToken?: string;
  summaryData?: IDocumentSummary;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  isPublicShare?: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageSender = 'user' | 'assistant';

export interface ISourceCitation {
  pageNumber: number;
  snippet: string;
  score: number;
}

export interface IMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  sources?: ISourceCitation[];
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
