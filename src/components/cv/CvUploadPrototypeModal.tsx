'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { applicationsService } from '@/services';
import { Application } from '@/types';

interface FileUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  isValid: boolean;
  validationError?: string;
}

export function CvUploadPrototypeModal({
  jobId,
  isOpen,
  onClose,
  onUploadSuccess,
}: {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (created: Application[]) => void;
}) {
  const [selectedFiles, setSelectedFiles] = useState<FileUploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    succeeded: Application[];
    failedCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newItems: FileUploadItem[] = Array.from(e.target.files).map((file) => {
      const isPdfOrDocx =
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.docx') ||
        file.type === 'application/pdf' ||
        file.type.includes('word');

      const isUnderSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      let validationError: string | undefined;
      if (!isPdfOrDocx) {
        validationError = 'Unsupported format. Only .pdf and .docx files are accepted.';
      } else if (!isUnderSize) {
        validationError = 'File exceeds maximum limit of 10MB.';
      }

      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isValid: isPdfOrDocx && isUnderSize,
        validationError,
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSimulatedSubmit = async () => {
    const validOnes = selectedFiles.filter((f) => f.isValid);
    if (validOnes.length === 0) return;

    setUploading(true);
    try {
      const res = await applicationsService.simulateBatchUpload(
        jobId,
        validOnes.map((f) => ({
          fileName: f.name,
          fileSize: f.size,
          mimeType: f.type || 'application/pdf',
          rawFile: f.file,
        }))
      );

      setResults(res);
      onUploadSuccess(res.succeeded);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upload Applicant CVs</h2>
            <p className="text-xs text-slate-500">
              Select or drop candidate CVs for parsing and screening.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Dropzone */}
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center">
            <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">
              Click to select or drag and drop CV files
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports .pdf and .docx documents (max 10MB per file)
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Quick Pre-fab Sample Generator Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Add test fixtures:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFiles((prev) => [
                  ...prev,
                  {
                    id: String(Date.now() + 1),
                    file: new File([''], 'David_Standard_CV.pdf'),
                    name: 'David_Standard_CV.pdf',
                    size: 245000,
                    type: 'application/pdf',
                    isValid: true,
                  },
                ]);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              + Normal CV
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFiles((prev) => [
                  ...prev,
                  {
                    id: String(Date.now() + 2),
                    file: new File([''], 'Corrupted_Scan_File.pdf'),
                    name: 'Corrupted_Scan_File.pdf',
                    size: 512000,
                    type: 'application/pdf',
                    isValid: true,
                  },
                ]);
              }}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium"
            >
              + Sim. Corrupted CV
            </button>
          </div>

          {/* Selected File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Files Ready for Intake ({selectedFiles.length})
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-56 overflow-y-auto">
                {selectedFiles.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-sm bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className={`w-4 h-4 shrink-0 ${item.isValid ? 'text-indigo-600' : 'text-rose-500'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          {formatSize(item.size)}
                          {item.validationError && (
                            <span className="text-rose-600 font-medium ml-2">{item.validationError}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result Feedback Banner */}
          {results && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Batch intake simulation complete
              </div>
              <p className="text-slate-600">
                Created {results.succeeded.length} application records.
                {results.failedCount > 0 && (
                  <span className="text-rose-600 font-medium ml-1">
                    {results.failedCount} files simulated unreadable format.
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedFiles.filter((f) => f.isValid).length} valid documents selected
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
            >
              {results ? 'Close' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={uploading || selectedFiles.filter((f) => f.isValid).length === 0}
              onClick={handleSimulatedSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Simulating Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Submit to Screening Engine
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
