export type ScenarioId = 'ckd' | 'masld';

export interface RubricItem {
  id: string;
  label: string;
  points: number;
  description: string;
}

export interface TaskQuestion {
  id: number;
  questionNumber: number;
  slideNumber: number;
  title: string;
  questionText: string;
  options?: string[];
  evaluationFocus: string;
  rubrics: RubricItem[];
  answerSlideNumber: number;
  cautionNotes?: string;
}

export interface OXQuizItem {
  id: number;
  question: string;
  isCorrectTrue: boolean; // true = 〇, false = ×
  points: number;
  explanation: string;
}

export interface SlideData {
  page: number;
  title: string;
  subtitle?: string;
  content: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  notes?: string;
  isQuestionSlide?: boolean;
  isAnswerSlide?: boolean;
  questionId?: number;
}

export interface ScenarioData {
  id: ScenarioId;
  title: string;
  subtitle: string;
  author: string;
  targetAudience: string;
  disclaimer: string;
  slides: SlideData[];
  tasks: TaskQuestion[];
  oxQuizzes: OXQuizItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  evaluation?: {
    score: number;
    maxScore: number;
    affirmativeFeedback: string;
    constructiveFeedback: string;
    rubricResults: {
      id: string;
      label: string;
      achieved: 'full' | 'partial' | 'none';
      pointsAwarded: number;
      feedback: string;
    }[];
    nextActionPrompt: string;
    readyForNext: boolean;
  };
  oxQuizAnswer?: {
    questionId: number;
    userAnswer: boolean;
    isCorrect: boolean;
    explanation: string;
  };
}

export interface FinalFeedbackReport {
  scenarioTitle: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  taskScores: {
    taskNumber: number;
    title: string;
    score: number;
    maxScore: number;
  }[];
  oxScore: number;
  maxOxScore: number;
  strengths: string[];
  improvementAreas: string[];
  overallComment: string;
  completionDate: string;
}
