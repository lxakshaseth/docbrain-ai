'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useDocumentStore } from '../../store/useDocumentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { IDocument } from '@pdf-chatbot/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const DocumentUpload: React.FC = () => {
  const { addDocument, setActiveDocument } = useDocumentStore();
  const { token, setAuthModalOpen } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    if (file.type !== 'application/pdf') {
      setIsError(true);
      setStatusMessage('Please select a valid PDF document.');
      return;
    }

    setUploading(true);
    setStatusMessage('Uploading & queueing for AI vector ingestion...');
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
        setStatusMessage(`'${uploadedDoc.title}' uploaded successfully! Processing chunks...`);
      } else {
        setIsError(true);
        setStatusMessage(data.message || 'Failed to upload PDF document');
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Network error uploading document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-400" /> Upload PDF Document
      </h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-lg p-6 flex flex-col items-center justify-center transition-all bg-slate-950/40 hover:bg-slate-950/80 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-blue-400 mb-2 transition-colors" />
        <p className="text-xs font-medium text-slate-300">Click or drag PDF file to upload</p>
        <p className="text-[10px] text-slate-500 mt-1">Maximum 10 MB file size</p>
      </div>

      {statusMessage && (
        <div
          className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            isError
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : uploading
              ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
