'use client';

import React, { useState } from 'react';
import { Sliders, RefreshCw, Zap, X, Info, Sparkles } from 'lucide-react';

export interface CriteriaWeights {
  techStack: number;
  experience: number;
  cloudDevOps: number;
  systemArchitecture: number;
  leadership: number;
}

export const DEFAULT_WEIGHTS: CriteriaWeights = {
  techStack: 35,
  experience: 25,
  cloudDevOps: 20,
  systemArchitecture: 15,
  leadership: 5,
};

interface CriteriaWeightSlidersProps {
  isOpen: boolean;
  onClose: () => void;
  weights: CriteriaWeights;
  onChange: (weights: CriteriaWeights) => void;
  onReset: () => void;
}

export function CriteriaWeightSliders({
  isOpen,
  onClose,
  weights,
  onChange,
  onReset,
}: CriteriaWeightSlidersProps) {
  if (!isOpen) return null;

  const total =
    weights.techStack +
    weights.experience +
    weights.cloudDevOps +
    weights.systemArchitecture +
    weights.leadership;

  const handleSliderChange = (key: keyof CriteriaWeights, value: number) => {
    onChange({
      ...weights,
      [key]: value,
    });
  };

  const applyPreset = (presetWeights: CriteriaWeights) => {
    onChange(presetWeights);
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Live Criteria Weight Sliders (Instant Re-Ranking)
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Total: {total}%
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Change priority weights to re-calculate match scores and instantly re-rank all candidates without re-reading CVs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset to default baseline weights"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
          Priority Presets:
        </span>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              techStack: 20,
              experience: 20,
              cloudDevOps: 45,
              systemArchitecture: 10,
              leadership: 5,
            })
          }
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
        >
          ☁️ Cloud / AWS Priority (45%)
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              techStack: 20,
              experience: 45,
              cloudDevOps: 15,
              systemArchitecture: 15,
              leadership: 5,
            })
          }
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
        >
          ⏳ Senior Experience Heavy (45%)
        </button>
        <button
          type="button"
          onClick={() =>
            applyPreset({
              techStack: 50,
              experience: 20,
              cloudDevOps: 15,
              systemArchitecture: 10,
              leadership: 5,
            })
          }
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
        >
          ⚡ Core Stack & Coding (50%)
        </button>
        <button
          type="button"
          onClick={() => applyPreset(DEFAULT_WEIGHTS)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Balanced Default
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {/* Slider 1: Core Tech Stack */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Core Tech Stack (React/Node)</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{weights.techStack}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={weights.techStack}
            onChange={(e) => handleSliderChange('techStack', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Slider 2: Years Experience */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Commercial Experience Years</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{weights.experience}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={weights.experience}
            onChange={(e) => handleSliderChange('experience', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Slider 3: Cloud & DevOps */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Cloud / AWS / Docker</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{weights.cloudDevOps}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={weights.cloudDevOps}
            onChange={(e) => handleSliderChange('cloudDevOps', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Slider 4: System Architecture */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Architecture & Databases</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{weights.systemArchitecture}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={weights.systemArchitecture}
            onChange={(e) => handleSliderChange('systemArchitecture', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Slider 5: Leadership */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Communication & Leadership</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{weights.leadership}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="70"
            step="5"
            value={weights.leadership}
            onChange={(e) => handleSliderChange('leadership', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
        </div>

        {/* Real-time Indicator banner */}
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Live Re-Ranking Active
            </span>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300/80">
              Table ranking updates continuously.
            </p>
          </div>
          <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {total}%
          </span>
        </div>
      </div>
    </div>
  );
}
