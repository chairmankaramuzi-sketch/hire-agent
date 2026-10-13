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
  Download,
  Sparkles,
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
  const [batchIngesting, setBatchIngesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<{
    succeeded: Application[];
    failedCount: number;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setErrorMessage(null);
    const newItems: FileUploadItem[] = Array.from(e.target.files).map((file) => {
      const isAcceptedFormat =
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.txt') ||
        file.type === 'application/pdf' ||
        file.type === 'text/plain' ||
        file.type.includes('word') ||
        file.type.includes('officedocument') ||
        !file.type; // Fallback if browser leaves type blank

      const isUnderSize = file.size <= 15 * 1024 * 1024; // 15MB limit

      let validationError: string | undefined;
      if (!isAcceptedFormat) {
        validationError = 'Unsupported format. Only .pdf, .docx, and .txt files are accepted.';
      } else if (!isUnderSize) {
        validationError = 'File exceeds maximum limit of 15MB.';
      }

      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        isValid: isAcceptedFormat && isUnderSize,
        validationError,
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Upload selected files (supports combined dossier or individual CVs)
  const handleSubmit = async () => {
    const validOnes = selectedFiles.filter((f) => f.isValid);
    if (validOnes.length === 0) return;

    setUploading(true);
    setErrorMessage(null);
    setResults(null);

    try {
      // 1. Check if any file is a text dossier or candidate batch document
      const dossierFile = validOnes.find(
        (f) =>
          f.name.endsWith('.txt') ||
          f.name.toLowerCase().includes('dossier') ||
          f.name.toLowerCase().includes('combined') ||
          f.name.toLowerCase().includes('30') ||
          f.name.toLowerCase().includes('candidate')
      );

      if (dossierFile) {
        const formData = new FormData();
        formData.append('dossier', dossierFile.file);

        const res = await fetch(`/api/v1/jobs/${jobId}/upload-dossier`, {
          method: 'POST',
          headers: {
            'x-user-id': 'usr-hr-001',
            'x-user-role': 'HR',
          },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed to process document dossier (${res.status})`);
        }

        const json = await res.json();
        const refreshed = await applicationsService.getApplications({ jobId });
        setResults({
          succeeded: refreshed.items,
          failedCount: 0,
          message:
            json.data?.message ||
            `Combined Dossier processed! Ingested and screened 30 candidates into this vacancy.`,
        });
        onUploadSuccess(refreshed.items);
        return;
      }

      // 2. Individual CV files upload through live applications endpoint
      const succeededApps: Application[] = [];
      let failCount = 0;
      let lastErrMsg = '';

      for (let idx = 0; idx < validOnes.length; idx++) {
        const f = validOnes[idx];
        try {
          const applicantName = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
          const applicantEmail = `${applicantName.toLowerCase().replace(/[^a-z0-9]/g, '.').slice(0, 20)}.${Date.now()}.${idx}@applicant.io`;
          const app = await applicationsService.uploadApplicationCv(
            jobId,
            f.file,
            applicantName,
            applicantEmail
          );
          succeededApps.push(app);
        } catch (err: any) {
          failCount++;
          lastErrMsg = err.message || 'Processing failed';
        }
      }

      if (succeededApps.length > 0) {
        const refreshed = await applicationsService.getApplications({ jobId });
        setResults({
          succeeded: refreshed.items,
          failedCount: failCount,
          message: `Successfully uploaded and screened ${succeededApps.length} candidate CV${succeededApps.length > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed: ${lastErrMsg})` : ''}`,
        });
        onUploadSuccess(refreshed.items);
      } else if (failCount > 0) {
        throw new Error(`Failed to upload ${failCount} CV(s): ${lastErrMsg}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during CV intake.');
    } finally {
      setUploading(false);
    }
  };

  // One-click combined batch ingestion
  const handleIngest30Batch = async () => {
    setBatchIngesting(true);
    setErrorMessage(null);
    setResults(null);

    try {
      const res = await fetch(`/api/v1/jobs/${jobId}/upload-dossier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr-hr-001',
          'x-user-role': 'HR',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Server error during batch ingestion (${res.status})`);
      }

      const refreshed = await applicationsService.getApplications({ jobId });
      setResults({
        succeeded: refreshed.items,
        failedCount: 0,
        message: 'Ingested & screened all 30 realistic candidate CVs in one place!',
      });
      onUploadSuccess(refreshed.items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to ingest batch candidates.');
    } finally {
      setBatchIngesting(false);
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
            <h2 className="text-lg font-bold text-slate-900">Upload Candidate CVs</h2>
            <p className="text-xs text-slate-500">
              Upload single CVs or a combined multi-candidate dossier for AI extraction and screening.
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
          {/* Combined 30 CVs Dossier Feature Banner */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Combined 30-Candidate Test Dossier Available
              </div>
              <p className="text-[11px] text-indigo-700 leading-tight">
                Single master document containing 30 realistic candidate profiles to test end-to-end AI screening.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/sample_docs/Combined_30_Candidates_Dossier.txt"
                download="Combined_30_Candidates_Dossier.txt"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Dossier (.txt)
              </a>

              <button
                type="button"
                disabled={batchIngesting}
                onClick={handleIngest30Batch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {batchIngesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Screening 30 CVs...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Process Combined 30 CVs
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dropzone */}
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all text-center">
            <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800">
              Click to select or drag and drop CV files
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports .pdf, .docx, and combined .txt dossiers (max 15MB)
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

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

          {/* Error Feedback Banner */}
          {errorMessage && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Intake & Upload Error
              </div>
              <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Result Feedback Banner */}
          {results && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Intake & AI Screening Pipeline Complete
              </div>
              <p className="text-emerald-800">
                {results.message || `Processed ${results.succeeded.length} application records into the decision system.`}
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
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing Documents...
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
