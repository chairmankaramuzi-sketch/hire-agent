'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Save,
} from 'lucide-react';
import { jobsService } from '@/services';
import { CriterionType, JobStatus } from '@/types';

interface CriterionFormItem {
  id: string;
  name: string;
  description: string;
  criterionType: CriterionType;
  weight?: number;
}

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<JobStatus>('PUBLISHED');
  const [scoreThreshold, setScoreThreshold] = useState(70);

  const [criteria, setCriteria] = useState<CriterionFormItem[]>([
    {
      id: '1',
      name: 'Minimum Relevant Experience',
      description: 'Candidate must have at least 3 years in a matching technical role.',
      criterionType: 'MANDATORY',
    },
    {
      id: '2',
      name: 'Relevant Technical Degree',
      description: "Bachelor's degree or accredited industry qualification equivalent.",
      criterionType: 'MANDATORY',
    },
    {
      id: '3',
      name: 'Core Technical Competencies',
      description: 'Demonstrated experience in TypeScript, React, and relational SQL databases.',
      criterionType: 'SCORED',
      weight: 60,
    },
    {
      id: '4',
      name: 'Automated Testing & Code Quality',
      description: 'Unit testing with Vitest/Jest and CI/CD automated pipeline familiarity.',
      criterionType: 'SCORED',
      weight: 40,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Compute total weight for scored criteria
  const scoredCriteria = criteria.filter((c) => c.criterionType === 'SCORED');
  const totalScoredWeight = scoredCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightValid = scoredCriteria.length === 0 || totalScoredWeight === 100;

  const addCriterion = (type: CriterionType) => {
    setCriteria([
      ...criteria,
      {
        id: String(Date.now()),
        name: '',
        description: '',
        criterionType: type,
        weight: type === 'SCORED' ? 0 : undefined,
      },
    ]);
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter((c) => c.id !== id));
  };

  const updateCriterion = (id: string, updates: Partial<CriterionFormItem>) => {
    setCriteria(criteria.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a job title.');
      return;
    }

    if (criteria.some((c) => !c.name.trim())) {
      setError('All criteria must have a title or name specified.');
      return;
    }

    if (!isWeightValid) {
      setError(`Scored criteria weights must sum to exactly 100%. Current total: ${totalScoredWeight}%.`);
      return;
    }

    setSubmitting(true);
    try {
      const created = await jobsService.createJob({
        title,
        department,
        description,
        status,
        scoreThreshold,
        criteria: criteria.map((c) => ({
          name: c.name,
          description: c.description,
          criterionType: c.criterionType,
          weight: c.criterionType === 'SCORED' ? c.weight : undefined,
        })),
      });

      router.push(`/jobs/${created.id}/applications`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred saving the vacancy.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/jobs"
          className="text-slate-500 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Define New Vacancy & Criteria</h1>
          <p className="text-sm text-slate-500">
            Set up job details and specify strict mandatory requirements vs weighted evaluation criteria.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Validation Error</p>
            <p className="text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Details Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            General Job Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lead Frontend Engineer"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Security">Security & Compliance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Job Description & Key Responsibilities
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline role scope, core objectives, and domain context..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="PUBLISHED">Published (Open for intake)</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Shortlist Score Threshold (%): {scoreThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(Number(e.target.value))}
                className="w-full mt-2 accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Screening Criteria Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Screening & Evaluation Criteria</h2>
              <p className="text-xs text-slate-500">
                Mandatory criteria gate eligibility; scored criteria determine candidate rank.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addCriterion('MANDATORY')}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Mandatory
              </button>
              <button
                type="button"
                onClick={() => addCriterion('SCORED')}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Scored
              </button>
            </div>
          </div>

          {/* Criteria List */}
          <div className="space-y-4">
            {criteria.map((crit, index) => (
              <div
                key={crit.id}
                className={`p-4 rounded-lg border transition-all ${
                  crit.criterionType === 'MANDATORY'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-indigo-100 bg-indigo-50/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        crit.criterionType === 'MANDATORY'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      }`}
                    >
                      {crit.criterionType}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">#{index + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {crit.criterionType === 'SCORED' && (
                      <div className="flex items-center gap-1 text-xs">
                        <label className="font-semibold text-slate-600">Weight:</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={crit.weight ?? 0}
                          onChange={(e) => updateCriterion(crit.id, { weight: Number(e.target.value) })}
                          className="w-16 px-2 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded bg-white"
                        />
                        <span className="text-slate-500 font-bold">%</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCriterion(crit.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white transition-colors"
                      title="Remove criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  <input
                    type="text"
                    required
                    placeholder="Criterion title (e.g. 4+ Years Experience)"
                    value={crit.name}
                    onChange={(e) => updateCriterion(crit.id, { name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Rule details or acceptable equivalents..."
                    value={crit.description}
                    onChange={(e) => updateCriterion(crit.id, { description: e.target.value })}
                    className="w-full px-3 py-1 text-xs text-slate-600 border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Scored Weight Summary Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
              isWeightValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isWeightValid ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="font-semibold">
                Scored Criteria Weight Total: {totalScoredWeight}% / 100%
              </span>
            </div>
            {!isWeightValid && (
              <span className="font-medium text-rose-700">Weights must sum to 100% to save.</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/jobs"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !isWeightValid}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving Vacancy...' : 'Save & Publish Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
