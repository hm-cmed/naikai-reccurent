import React, { useState } from 'react';
import { OXQuizItem } from '../types';
import { CheckCircle, XCircle, Award, ArrowRight, HelpCircle, RotateCcw } from 'lucide-react';

interface OXQuizSectionProps {
  quizzes: OXQuizItem[];
  onComplete: (score: number, maxScore: number, answers: Record<number, boolean>) => void;
  onRequestOverallFeedback: () => void;
}

export const OXQuizSection: React.FC<OXQuizSectionProps> = ({
  quizzes,
  onComplete,
  onRequestOverallFeedback
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = quizzes.every((q) => userAnswers[q.id] !== undefined);

  const calculateScore = () => {
    let score = 0;
    quizzes.forEach((q) => {
      if (userAnswers[q.id] === q.isCorrectTrue) {
        score += q.points;
      }
    });
    return score;
  };

  const maxScore = quizzes.reduce((sum, q) => sum + q.points, 0);

  const handleSubmit = () => {
    if (!allAnswered) return;
    const score = calculateScore();
    setSubmitted(true);
    onComplete(score, maxScore, userAnswers);
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded border border-amber-500/30">
            最終ステップ
          </span>
          <h3 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
            💡 学習ポイントに基づく〇×クイズ（全{quizzes.length}問）
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          全問の解答を選択して「解答を送信」を押してください。各問題の正誤判定と詳細な解説が提示されます。
        </p>
      </div>

      {/* Quiz Items List */}
      <div className="space-y-5">
        {quizzes.map((quiz, index) => {
          const selected = userAnswers[quiz.id];
          const isCorrect = selected === quiz.isCorrectTrue;

          return (
            <div
              key={quiz.id}
              className={`p-4 rounded-xl border transition-all ${
                submitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {/* Question Header & Prompt */}
              <div className="flex items-start gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-teal-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                  Q{index + 1}
                </span>
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  {quiz.question}
                </p>
              </div>

              {/* True/False Buttons */}
              <div className="flex items-center gap-3 pl-9 mb-2">
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setUserAnswers((prev) => ({ ...prev, [quiz.id]: true }))}
                  className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                    selected === true
                      ? 'bg-teal-600 text-white shadow-lg ring-2 ring-teal-400'
                      : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  } disabled:opacity-80`}
                >
                  <span className="text-base">⭕</span>
                  <span>正しい（〇）</span>
                </button>

                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setUserAnswers((prev) => ({ ...prev, [quiz.id]: false }))}
                  className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                    selected === false
                      ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-400'
                      : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  } disabled:opacity-80`}
                >
                  <span className="text-base">❌</span>
                  <span>誤り（×）</span>
                </button>

                <span className="text-xs text-slate-500 ml-auto">
                  配点: {quiz.points}点
                </span>
              </div>

              {/* Feedback and Explanation after submit */}
              {submitted && (
                <div className="mt-3 pt-3 border-t border-slate-700/60 pl-9 space-y-2">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle className="w-4 h-4" />
                        【正解！】 (+{quiz.points}点)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <XCircle className="w-4 h-4" />
                        【不正解】（正答: {quiz.isCorrectTrue ? '〇' : '×'}）
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {quiz.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-800">
        {!submitted ? (
          <>
            <p className="text-xs text-slate-400">
              {allAnswered
                ? '全問選択完了しました。「解答を送信」を押してください。'
                : `未回答の設問があります（残り ${
                    quizzes.length - Object.keys(userAnswers).length
                  } 問）`}
            </p>
            <button
              id="submit-ox-quiz-btn"
              disabled={!allAnswered}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>解答を送信して判定</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="bg-teal-950 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 text-teal-200">
                <Award className="w-4 h-4 text-teal-400" />
                <span>クイズスコア:</span>
                <span className="font-bold text-teal-300 font-mono text-sm">
                  {calculateScore()} / {maxScore} 点
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200 p-2 rounded hover:bg-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                やり直す
              </button>
            </div>

            <button
              id="view-overall-feedback-btn"
              onClick={onRequestOverallFeedback}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-900/30 transition-all flex items-center justify-center gap-2 animate-pulse"
            >
              <span>全体総括フィードバックを見る</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
