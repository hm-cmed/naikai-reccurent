import React from 'react';
import { ScenarioData, ScenarioId } from '../types';
import { SCENARIOS } from '../data/index';
import { BookOpen, ShieldAlert, Award, RotateCcw, Stethoscope } from 'lucide-react';

interface HeaderProps {
  currentScenario: ScenarioData;
  onSelectScenario: (id: ScenarioId) => void;
  currentStepIndex: number;
  totalSteps: number;
  totalScore: number;
  maxPossibleScore: number;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenario,
  onSelectScenario,
  currentStepIndex,
  totalSteps,
  totalScore,
  maxPossibleScore,
  onReset
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      {/* Top Disclaimer Bar */}
      <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-4xl truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium">免責事項:</span>
          <span className="truncate">{currentScenario.disclaimer}</span>
        </div>
        <div className="text-slate-400 text-[11px] hidden sm:block shrink-0">
          AI臨床推論チューター (Gemini 3.8 Flash)
        </div>
      </div>

      {/* Main Header Content */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 max-w-7xl mx-auto">
        {/* Title and Scenario Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 shadow-inner">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-100 text-base md:text-lg tracking-tight">
                臨床シナリオ学習チューター
              </h1>
              <span className="text-[11px] bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-500/30">
                ステップ学習
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {currentScenario.title}
            </p>
          </div>
        </div>

        {/* Controls and Score */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              id="scenario-select"
              value={currentScenario.id}
              onChange={(e) => onSelectScenario(e.target.value as ScenarioId)}
              className="bg-transparent text-xs text-slate-200 font-medium py-1 px-1.5 focus:outline-none cursor-pointer rounded"
            >
              {Object.values(SCENARIOS).map((sc) => (
                <option key={sc.id} value={sc.id} className="bg-slate-900 text-slate-100">
                  {sc.id === 'ckd' ? '📌 CKD シックデイ編（添付スライド）' : '📋 MASLD・脂肪肝編'}
                </option>
              ))}
            </select>
          </div>

          {/* Progress / Step Badge */}
          <div className="bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs flex items-center gap-2">
            <span className="text-slate-400">進捗:</span>
            <span className="font-semibold text-teal-400">
              {currentStepIndex} / {totalSteps}
            </span>
          </div>

          {/* Live Score */}
          <div className="bg-teal-950/60 border border-teal-500/30 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 text-teal-200">
            <Award className="w-3.5 h-3.5 text-teal-400" />
            <span>スコア:</span>
            <span className="font-bold text-teal-300 font-mono">
              {totalScore}
            </span>
            <span className="text-slate-400 text-[10px]">/ {maxPossibleScore}点</span>
          </div>

          {/* Reset button */}
          <button
            id="reset-scenario-btn"
            onClick={onReset}
            title="シナリオを最初からやり直す"
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
