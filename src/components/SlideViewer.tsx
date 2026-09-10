import React, { useState } from 'react';
import { ScenarioData, SlideData } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface SlideViewerProps {
  scenario: ScenarioData;
  currentSlideIndex: number;
  onSlideChange: (pageIndex: number) => void;
  activeTaskId?: number;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  scenario,
  currentSlideIndex,
  onSlideChange,
  activeTaskId
}) => {
  const [showNotes, setShowNotes] = useState(true);
  const [activeTab, setActiveTab] = useState<'slide' | 'record' | 'lab'>('slide');

  const slides = scenario.slides;
  const currentSlide: SlideData = slides[currentSlideIndex] || slides[0];

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      onSlideChange(currentSlideIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Top Slide Tab Bar */}
      <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-slide-btn"
            onClick={() => setActiveTab('slide')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'slide'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            スライド教材
          </button>
          <button
            id="tab-record-btn"
            onClick={() => setActiveTab('record')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'record'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            カルテ・問診
          </button>
          <button
            id="tab-lab-btn"
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            検査データ
          </button>
        </div>

        {/* Quick jump to question slides */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400">
          <span className="mr-1 text-slate-500 font-mono">設問ジャンプ:</span>
          {scenario.tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onSlideChange(task.slideNumber - 1)}
              className={`px-1.5 py-0.5 rounded border transition-colors ${
                currentSlide.page === task.slideNumber
                  ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              Q{task.questionNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Main Slide Canvas or Clinical Record */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5 flex flex-col items-center justify-start bg-slate-900/50">
        {activeTab === 'slide' && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all">
            {/* Slide Header Banner */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600 tracking-wide uppercase">
                {scenario.targetAudience}
              </span>
              <div className="flex items-center gap-2">
                {currentSlide.isQuestionSlide && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <HelpCircle className="w-3 h-3" />
                    質問スライド
                  </span>
                )}
                {currentSlide.isAnswerSlide && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    解説スライド
                  </span>
                )}
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {currentSlide.page} / {slides.length}
                </span>
              </div>
            </div>

            {/* Slide Content Area */}
            <div className="p-6 md:p-8 min-h-[360px] flex flex-col justify-between text-slate-800">
              <div>
                {/* Slide Title */}
                <h2
                  className={`font-bold tracking-tight mb-2 ${
                    currentSlide.page === 1
                      ? 'text-2xl md:text-3xl text-red-600 font-serif leading-tight'
                      : currentSlide.isQuestionSlide
                      ? 'text-lg md:text-xl text-red-600'
                      : 'text-lg md:text-xl text-slate-900 border-b-2 border-teal-600 pb-1.5 inline-block'
                  }`}
                >
                  {currentSlide.title}
                </h2>

                {currentSlide.subtitle && (
                  <p className="text-xs md:text-sm text-slate-500 font-medium mb-5">
                    {currentSlide.subtitle}
                  </p>
                )}

                {/* Bullet Points / Paragraphs */}
                <div className="space-y-2.5 text-sm md:text-base leading-relaxed text-slate-700">
                  {currentSlide.content.map((line, idx) => {
                    if (!line) return <div key={idx} className="h-2" />;
                    if (line.startsWith('•') || line.startsWith('') || line.startsWith('')) {
                      return (
                        <div key={idx} className="flex items-start gap-2 pl-2">
                          <span className="text-teal-600 font-bold">•</span>
                          <span>{line.replace(/^[•]\s*/, '')}</span>
                        </div>
                      );
                    }
                    if (line.startsWith('👉')) {
                      return (
                        <div
                          key={idx}
                          className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-teal-900 text-xs md:text-sm font-medium mt-3"
                        >
                          {line}
                        </div>
                      );
                    }
                    if (line.startsWith('①') || line.startsWith('②') || line.startsWith('③') || line.startsWith('④')) {
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs md:text-sm font-medium pl-3 transition-colors ${
                            line.startsWith('③') && currentSlide.isAnswerSlide
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          {line}
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="whitespace-pre-line">
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Slide Table Data (if any) */}
                {currentSlide.tableData && (
                  <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          {currentSlide.tableData.headers.map((h, i) => (
                            <th key={i} className="px-3 py-2">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentSlide.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 font-medium">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Slide Footer */}
              <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{scenario.author}</span>
                <span className="font-mono">P.{currentSlide.page}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Clinical Medical Record */}
        {activeTab === 'record' && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4 text-slate-800">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">初診時カルテ・基本情報</h3>
                <p className="text-xs text-slate-500">200床 市中病院 内科初診外来</p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-1 rounded">
                日内 腎太郎（78歳 男性）
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">主訴</span>
                <p className="text-slate-800">下痢、食欲不振、ふらつき</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">既往歴</span>
                <p className="text-slate-800">慢性心不全の増悪で入院歴あり</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">現病歴</span>
              <p className="text-slate-800 leading-relaxed">
                3日前から食欲低下。水分摂取はなんとかしていた。昨日から下痢が出現（水様便1日4〜5回）。飲食で下痢になるため水分摂取を控えがちだった。昨日は尿量も少なく排尿回数も低下。今朝ふらつきと下痢持続のため予約外受診。息切れや起坐呼吸なし。体重変化なし。普段のCrは1.5 mg/dL程度。4日前に腰痛のため市販ロキソプロフェンを内服開始。
              </p>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs">
              <span className="font-bold text-amber-900 block mb-1">現在処方されている定期内服薬</span>
              <ul className="list-disc pl-4 space-y-1 text-amber-950">
                <li>カンデサルタン 8 mg（ARB / RAS阻害薬）</li>
                <li>ダパグリフロジン 5 mg（SGLT2阻害薬）</li>
                <li>フロセミド 20 mg（ループ利尿薬）</li>
                <li>アトルバスタチン 10 mg（スタチン）</li>
                <li>カルベジロール 2.5 mg（β遮断薬）</li>
                <li>アムロジピン 5 mg（カルシウム拮抗薬）</li>
                <li>メトホルミン塩酸塩 500 mg（ビグアナイド系血糖降下薬）</li>
                <li className="font-semibold text-red-700">市販薬: ロキソプロフェン（NSAIDs）を4日前より自己内服</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 3: Lab Test Data */}
        {activeTab === 'lab' && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4 text-slate-800">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">初診時 臨床検査データ一覧</h3>
                <p className="text-xs text-slate-500">血液・生化学・検尿・血液ガス分析</p>
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
                異常値あり
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-700 mb-1.5">血算・生化学</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">WBC</span>
                    <span className="font-bold text-slate-900">8,600 /μL</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Hb</span>
                    <span className="font-bold text-slate-900">10.5 g/dL</span>
                  </div>
                  <div className="p-2 rounded bg-red-50 border border-red-300">
                    <span className="text-red-600 block text-[10px] font-bold">BUN (高値)</span>
                    <span className="font-bold text-red-700">58 mg/dL</span>
                  </div>
                  <div className="p-2 rounded bg-red-50 border border-red-300">
                    <span className="text-red-600 block text-[10px] font-bold">Cr (ベースライン1.5)</span>
                    <span className="font-bold text-red-700">2.8 mg/dL</span>
                  </div>
                  <div className="p-2 rounded bg-red-50 border border-red-300">
                    <span className="text-red-600 block text-[10px] font-bold">血清K (高K血症)</span>
                    <span className="font-bold text-red-700">5.8 mEq/L</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">血清Na</span>
                    <span className="font-bold text-slate-900">137 mEq/L</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">血糖</span>
                    <span className="font-bold text-slate-900">103 mg/dL</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">CRP</span>
                    <span className="font-bold text-slate-900">2.1 mg/dL</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1.5">尿検査・血液ガス分析</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">尿蛋白</span>
                    <span className="font-bold text-slate-900">(1+)</span>
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-300">
                    <span className="text-amber-700 block text-[10px] font-bold">尿糖</span>
                    <span className="font-bold text-amber-800">(4+)</span>
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-300">
                    <span className="text-amber-700 block text-[10px] font-bold">尿ケトン体</span>
                    <span className="font-bold text-amber-800">(±)</span>
                  </div>
                  <div className="p-2 rounded bg-red-50 border border-red-300">
                    <span className="text-red-600 block text-[10px] font-bold">血液ガス pH / HCO3-</span>
                    <span className="font-bold text-red-700">7.32 / 18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Speaker Notes / Audio Transcript Collapsible Section */}
      {currentSlide.notes && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-medium"
            >
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              <span>講義音声スクリプト / 発表者ノート</span>
              <span className="text-[10px] text-slate-500">
                ({showNotes ? '折りたたむ' : '表示する'})
              </span>
            </button>
          </div>
          {showNotes && (
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-sans">
              {currentSlide.notes}
            </p>
          )}
        </div>
      )}

      {/* Slide Navigation Bottom Bar */}
      <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
        <button
          id="prev-slide-btn"
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
          前へ
        </button>

        {/* Slide Range Slider */}
        <div className="flex items-center gap-2 flex-1 max-w-xs mx-4">
          <input
            type="range"
            min="0"
            max={slides.length - 1}
            value={currentSlideIndex}
            onChange={(e) => onSlideChange(Number(e.target.value))}
            className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-xs text-slate-400 font-mono shrink-0">
            {currentSlideIndex + 1}/{slides.length}
          </span>
        </div>

        <button
          id="next-slide-btn"
          onClick={handleNext}
          disabled={currentSlideIndex === slides.length - 1}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
        >
          次へ
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
