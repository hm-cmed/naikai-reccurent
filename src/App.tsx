import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SlideViewer } from './components/SlideViewer';
import { ChatTutor } from './components/ChatTutor';
import { OXQuizSection } from './components/OXQuizSection';
import { OverallFeedbackModal } from './components/OverallFeedbackModal';
import { getScenario } from './data/index';
import {
  ScenarioId,
  ChatMessage,
  FinalFeedbackReport
} from './types';

export default function App() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('ckd');
  const scenario = getScenario(scenarioId);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [phase, setPhase] = useState<'task' | 'quiz' | 'completed'>('task');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  // Score tracking
  const [taskEvaluations, setTaskEvaluations] = useState<
    {
      taskId: number;
      taskNumber: number;
      title: string;
      score: number;
      maxScore: number;
      userAnswer: string;
    }[]
  >([]);
  const [oxQuizScore, setOxQuizScore] = useState(0);
  const [oxQuizMaxScore, setOxQuizMaxScore] = useState(0);

  // Overall report modal
  const [showOverallModal, setShowOverallModal] = useState(false);
  const [overallReport, setOverallReport] = useState<FinalFeedbackReport | null>(null);

  const currentTask = scenario.tasks[currentTaskIndex];

  // Initialize scenario
  useEffect(() => {
    resetScenario(scenarioId);
  }, [scenarioId]);

  const resetScenario = (id: ScenarioId) => {
    const sc = getScenario(id);
    setCurrentSlideIndex(sc.tasks[0] ? sc.tasks[0].slideNumber - 1 : 0);
    setCurrentTaskIndex(0);
    setPhase('task');
    setTaskEvaluations([]);
    setOxQuizScore(0);
    setOxQuizMaxScore(0);
    setCanProceed(false);
    setOverallReport(null);
    setShowOverallModal(false);

    const initialTask = sc.tasks[0];
    const initialGreeting: ChatMessage = {
      id: 'welcome',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `こんにちは。オンラインシナリオ学習のAI臨床推論チューターです。\n\n本プログラムは【教育目的】であり、医療行為を推奨・指示するものではありません。\n左側のスライド資料や問診票・検査データを確認しながら、設問に対するあなたの考えを入力してください。\n\n【進め方と学習ルール】\n• ユーザーのことは「あなた」と呼称します。\n• 事前に正解例は提示しません。\n• あなたの解答に対し、適切な点には肯定的に、不足や誤りの点には建設的なフィードバックを返します。\n• 課題はステップ形式で進み、最後に〇×クイズと総合フィードバックを行います。\n\nそれでは、スライドP.${initialTask.slideNumber}の「課題1」について、あなたの考えを入力してください。`
    };

    setMessages([initialGreeting]);
  };

  const handleSendMessage = async (userAnswer: string) => {
    if (!currentTask) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsEvaluating(true);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          taskId: currentTask.id,
          taskTitle: currentTask.title,
          questionNumber: currentTask.questionNumber,
          questionText: currentTask.questionText,
          evaluationFocus: currentTask.evaluationFocus,
          cautionNotes: currentTask.cautionNotes,
          rubrics: currentTask.rubrics,
          answerSlideNumber: currentTask.answerSlideNumber,
          userAnswer
        })
      });

      const data = await response.json();

      if (data.securityAlert) {
        const securityMsg: ChatMessage = {
          id: `sec-${Date.now()}`,
          sender: 'ai',
          text: data.constructiveFeedback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, securityMsg]);
        setIsEvaluating(false);
        return;
      }

      const aiFeedbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evaluation: {
          score: data.score,
          maxScore: data.maxScore,
          affirmativeFeedback: data.affirmativeFeedback,
          constructiveFeedback: data.constructiveFeedback,
          rubricResults: data.rubricResults || [],
          nextActionPrompt: data.nextActionPrompt,
          readyForNext: true
        }
      };

      setMessages((prev) => [...prev, aiFeedbackMsg]);

      // Record evaluation
      setTaskEvaluations((prev) => [
        ...prev.filter((t) => t.taskId !== currentTask.id),
        {
          taskId: currentTask.id,
          taskNumber: currentTask.questionNumber,
          title: currentTask.title,
          score: data.score,
          maxScore: data.maxScore,
          userAnswer
        }
      ]);

      setCanProceed(true);
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'system',
        text: '評価サーバーとの通信中にエラーが発生しました。再度送信をお試しください。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleProceedToNextStep = () => {
    setCanProceed(false);

    if (currentTaskIndex < scenario.tasks.length - 1) {
      const nextIdx = currentTaskIndex + 1;
      const nextTask = scenario.tasks[nextIdx];
      setCurrentTaskIndex(nextIdx);
      setCurrentSlideIndex(nextTask.slideNumber - 1);

      const nextNotice: ChatMessage = {
        id: `next-task-${nextIdx}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `【課題 ${nextTask.questionNumber} に進みました】\nスライド P.${nextTask.slideNumber} を確認し、設問「${nextTask.questionText}」に対するあなたの解答を入力してください。`
      };
      setMessages((prev) => [...prev, nextNotice]);
    } else {
      // Transition to OX Quiz
      setPhase('quiz');
      // Jump to lecture/summary slides (slide 20 in CKD or slide 8 in MASLD)
      if (scenario.id === 'ckd') {
        setCurrentSlideIndex(19); // slide 20
      }
      const quizNotice: ChatMessage = {
        id: `quiz-notice`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `全課題の解答、お疲れ様でした！\n最後に、本シナリオの重要学修ポイントを確認する「〇×クイズ（全${scenario.oxQuizzes.length}問）」に挑戦しましょう。画面の設問に回答してください。`
      };
      setMessages((prev) => [...prev, quizNotice]);
    }
  };

  const handleCompleteOXQuiz = (score: number, maxScore: number) => {
    setOxQuizScore(score);
    setOxQuizMaxScore(maxScore);
  };

  const handleRequestOverallFeedback = async () => {
    setIsEvaluating(true);

    const tasksScoreTotal = taskEvaluations.reduce((sum, t) => sum + t.score, 0);
    const tasksMaxTotal = scenario.tasks.reduce(
      (sum, t) => sum + t.rubrics.reduce((rs, r) => rs + r.points, 0),
      0
    );
    const grandTotal = tasksScoreTotal + oxQuizScore;
    const grandMax = tasksMaxTotal + (oxQuizMaxScore || scenario.oxQuizzes.reduce((s, q) => s + q.points, 0));
    const percentage = grandMax > 0 ? Math.round((grandTotal / grandMax) * 1000) / 10 : 0;

    try {
      const response = await fetch('/api/overall-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          scenarioTitle: scenario.title,
          taskEvaluations,
          oxScore: oxQuizScore,
          maxOxScore: oxQuizMaxScore || scenario.oxQuizzes.reduce((s, q) => s + q.points, 0)
        })
      });

      const summaryData = await response.json();

      const report: FinalFeedbackReport = {
        scenarioTitle: scenario.title,
        totalScore: grandTotal,
        maxScore: grandMax,
        percentage,
        taskScores: taskEvaluations.map((t) => ({
          taskNumber: t.taskNumber,
          title: t.title,
          score: t.score,
          maxScore: t.maxScore
        })),
        oxScore: oxQuizScore,
        maxOxScore: oxQuizMaxScore || scenario.oxQuizzes.reduce((s, q) => s + q.points, 0),
        strengths: summaryData.strengths || [],
        improvementAreas: summaryData.improvementAreas || [],
        overallComment: summaryData.overallComment || '全課題を修了しました。',
        completionDate: new Date().toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setOverallReport(report);
      setShowOverallModal(true);
      setPhase('completed');
    } catch (e) {
      console.error('Failed to generate overall feedback:', e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentTotalScore =
    taskEvaluations.reduce((sum, t) => sum + t.score, 0) + oxQuizScore;
  const currentMaxScore =
    scenario.tasks.reduce(
      (sum, t) => sum + t.rubrics.reduce((rs, r) => rs + r.points, 0),
      0
    ) + scenario.oxQuizzes.reduce((s, q) => s + q.points, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <Header
        currentScenario={scenario}
        onSelectScenario={(id) => setScenarioId(id)}
        currentStepIndex={
          phase === 'task'
            ? currentTaskIndex + 1
            : phase === 'quiz'
            ? scenario.tasks.length + 1
            : scenario.tasks.length + 2
        }
        totalSteps={scenario.tasks.length + 2}
        totalScore={currentTotalScore}
        maxPossibleScore={currentMaxScore}
        onReset={() => resetScenario(scenarioId)}
      />

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Slide & Clinical Data Viewer */}
        <section className="w-full md:w-1/2 lg:w-3/5 h-1/2 md:h-full overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
          <SlideViewer
            scenario={scenario}
            currentSlideIndex={currentSlideIndex}
            onSlideChange={(idx) => setCurrentSlideIndex(idx)}
            activeTaskId={currentTask?.id}
          />
        </section>

        {/* Right Panel: Chat Tutor or OX Quiz */}
        <section className="w-full md:w-1/2 lg:w-2/5 h-1/2 md:h-full overflow-hidden flex flex-col bg-slate-900">
          {phase === 'task' ? (
            <ChatTutor
              currentTask={currentTask}
              messages={messages}
              onSendMessage={handleSendMessage}
              onProceedToNextStep={handleProceedToNextStep}
              onJumpToSlide={(slideNum) => setCurrentSlideIndex(slideNum - 1)}
              isEvaluating={isEvaluating}
              canProceed={canProceed}
              isCompleted={phase === 'completed'}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <OXQuizSection
                quizzes={scenario.oxQuizzes}
                onComplete={handleCompleteOXQuiz}
                onRequestOverallFeedback={handleRequestOverallFeedback}
              />
            </div>
          )}
        </section>
      </main>

      {/* Final Overall Feedback Modal */}
      {showOverallModal && overallReport && (
        <OverallFeedbackModal
          report={overallReport}
          onClose={() => setShowOverallModal(false)}
          onRestart={() => resetScenario(scenarioId)}
        />
      )}
    </div>
  );
}
