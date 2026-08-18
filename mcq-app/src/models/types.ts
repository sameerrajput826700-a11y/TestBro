/**
 * Core data models for the MCQ Test Application
 */

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  _internalKey?: string;
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  marks?: number;
  negativeMarks?: number;
  tags?: string[];
  image?: string;
  source?: string;
}

export interface QuestionBank {
  questions: Question[];
  totalCount: number;
  subjects: Set<string>;
  topics: Set<string>;
  difficulties: Set<string>;
}

export interface TestConfiguration {
  id: string;
  name: string;
  description?: string;
  numberOfQuestions: number;
  timeLimit: number; // in minutes
  marksPerCorrect: number;
  negativeMarking: number;
  passPercentage: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showQuestionNumbers: boolean;
  allowNavigation: boolean;
  allowChangingAnswers: boolean;
  allowMarkForReview: boolean;
  autoSubmitOnTimeExpire: boolean;
  fullscreenMode: boolean;
  randomSelection: boolean;
  selectionMode: 'all' | 'random' | 'selected' | 'filtered';
  selectedQuestionIds?: string[];
  filters?: {
    subjects?: string[];
    topics?: string[];
    difficulties?: string[];
    tags?: string[];
  };
  createdAt: number;
}

export interface TestAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
  isMarkedForReview: boolean;
}

export interface TestSession {
  id: string;
  studentId?: string;
  configId: string;
  questionIds: string[];
  optionOrders: Map<string, number[]>; // Maps questionId to shuffled option indices
  currentQuestionIndex: number;
  answers: Map<string, TestAnswer>; // Maps questionId to answer
  visitedQuestions: Set<string>;
  startTime: number;
  endTime?: number;
  remainingTimeMs: number;
  isSubmitted: boolean;
  isPaused: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface QuestionResult {
  questionId: string;
  selected: number | null;
  correct: number;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  isMarkedForReview: boolean;
}

export interface TestResult {
  id: string;
  studentId?: string;
  studentName?: string;
  sessionId: string;
  configId: string;
  testName: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  accuracy: number;
  timeTaken: number; // in seconds
  questionResults: QuestionResult[];
  submittedAt: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  password: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultMarks: number;
  defaultNegativeMarking: number;
  defaultTestDuration: number;
  autoSave: boolean;
  confirmBeforeSubmit: boolean;
  fullscreenMode: boolean;
}

export interface BackupData {
  version: number;
  createdAt: number;
  questions: Question[];
  testConfigs: TestConfiguration[];
  testResults: TestResult[];
  settings: AppSettings;
}

export interface ImportValidationResult {
  valid: Question[];
  invalid: Array<{
    data: any;
    error: string;
  }>;
  duplicateIds: string[];
}
