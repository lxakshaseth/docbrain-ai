'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, FileUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { IDocument } from '@pdf-chatbot/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface DocumentUploadProps {
  compact?: boolean;
  onSuccess?: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ compact = false, onSuccess }) => {
  const queryClient = useQueryClient();
  const { addDocument, setActiveDocument, setUploadingState } = useDocumentStore();
  const { token, setAuthModalOpen } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!token) {
      setAuthModalOpen(true, 'login');
      setIsError(true);
      setStatusMessage('Please sign in to upload documents.');
      return;
    }

    const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    const isValidExt = ALLOWED_EXTENSIONS.includes(ext);
    const isValidMime =
      file.type === 'application/pdf' ||
      file.type === 'application/x-pdf' ||
      file.type.startsWith('text/') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isValidExt && !isValidMime) {
      setIsError(true);
      setStatusMessage('Please select a valid PDF, DOCX, TXT, or MD document.');
      return;
    }

    setUploading(true);
    setUploadingState(true, file.name);
    setStatusMessage('Uploading & vectorizing PDF...');
    setIsError(false);

    try {
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

      if (response.ok && data.success && data.data) {
        const uploadedDoc: IDocument = data.data;
        addDocument(uploadedDoc);
        setActiveDocument(uploadedDoc);
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        setStatusMessage(`'${uploadedDoc.title}' uploaded successfully!`);
        if (onSuccess) onSuccess();
      } else {
        setIsError(true);
        setStatusMessage(data.message || 'Failed to upload PDF document');
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Network error uploading document');
    } finally {
      setUploading(false);
      setUploadingState(false, null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  if (compact) {
    return (
      <div className="w-full space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FileUp className="w-4 h-4 text-blue-100" />
          )}
          <span>{uploading ? 'Processing PDF...' : 'Upload New PDF'}</span>
        </button>

        {statusMessage && (
          <div
            className={`p-2.5 rounded-xl text-[11px] font-medium flex items-center gap-2 transition-all shadow-2xs ${
              isError
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : uploading
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-indigo-500" />
            ) : isError ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            )}
            <span className="truncate flex-1">{statusMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 shadow-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`cursor-pointer border border-dashed rounded-lg p-3.5 flex items-center gap-3 transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:bg-blue-50/50 dark:hover:bg-slate-900/80 hover:border-blue-500/40'
        }`}
      >
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
          <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
            {uploading ? 'Processing PDF...' : 'Upload PDF Document'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            Click or drop file (max 10MB)
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mt-2 p-2 rounded-lg text-[11px] flex items-center gap-2 ${
            isError
              ? 'bg-red-500/10 text-red-500 dark:text-red-400'
              : uploading
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : isError ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};


