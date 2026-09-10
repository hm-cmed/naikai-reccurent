import React from 'react';
import { FinalFeedbackReport } from '../types';
import { Award, CheckCircle2, AlertCircle, X, RotateCcw, Sparkles } from 'lucide-react';

interface OverallFeedbackModalProps {
  report: FinalFeedbackReport;
  onClose: () => void;
  onRestart: () => void;
}

export const OverallFeedbackModal: React.FC<OverallFeedbackModalProps> = ({
  report,
  onClose,
  onRestart
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                全体総括フィードバック・修了レポート
              </h2>
              <p className="text-xs text-slate-400">{report.scenarioTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Score Hero Banner */}
          <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-emerald-950/70 border border-teal-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-teal-300 font-semibold tracking-wide uppercase block mb-1">
                総合獲得スコア
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">
                  {report.totalScore}
                </span>
                <span className="text-slate-400 text-sm font-mono">
                  / {report.maxScore} 点
                </span>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  達成率 {report.percentage}%
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 sm:text-right space-y-0.5">
              <div>症例設問点: {report.totalScore - report.oxScore} 点</div>
              <div>〇×クイズ点: {report.oxScore} / {report.maxOxScore} 点</div>
              <div className="text-slate-400 text-[11px] pt-1">
                完了日時: {report.completionDate}
              </div>
            </div>
          </div>

          {/* Task by Task Scores */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              各課題の達成状況
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {report.taskScores.map((t) => (
                <div
                  key={t.taskNumber}
                  className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-200 truncate pr-2">
                    課題{t.taskNumber}: {t.title}
                  </span>
                  <span className="font-mono font-bold text-teal-400 shrink-0">
                    {t.score} / {t.maxScore} 点
                  </span>
                </div>
              ))}
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 flex items-center justify-between">
                <span className="font-medium text-slate-200">〇×クイズ（理解度チェック）</span>
                <span className="font-mono font-bold text-teal-400 shrink-0">
                  {report.oxScore} / {report.maxOxScore} 点
                </span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>発揮された臨床推論の強み</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-emerald-200/90 leading-relaxed">
                {report.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement Areas */}
          {report.improvementAreas.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>今後の臨床実践に向けたアドバイス・研鑽ポイント</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-amber-200/90 leading-relaxed">
                {report.improvementAreas.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Overall Tutor Comment */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              <span>チューターからの総括メッセージ</span>
            </div>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {report.overallComment}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onRestart}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            シナリオを最初からやり直す
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
