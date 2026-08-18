import type {
  Question,
  TestConfiguration,
  TestSession,
  TestAnswer,
  TestResult,
  QuestionResult,
} from '../models/types';
import { storage } from '../storage/storage';

/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getQuestionKey(question: Pick<Question, 'id' | '_internalKey'>): string {
  return question._internalKey ?? question.id;
}

/**
 * Test Engine - Core logic for test management
 */
export class TestEngine {
  /**
   * Create a new test session
   */
  static async createTestSession(
    config: TestConfiguration,
    allQuestions: Question[]
  ): Promise<TestSession> {
    let selectedQuestionIds: string[] = [];

    // Select questions based on configuration
    switch (config.selectionMode) {
      case 'all':
        selectedQuestionIds = allQuestions.map((q) => getQuestionKey(q));
        break;

      case 'random':
        selectedQuestionIds = fisherYatesShuffle(allQuestions.map((q) => getQuestionKey(q))).slice(
          0,
          config.numberOfQuestions
        );
        break;

      case 'selected':
        selectedQuestionIds = (config.selectedQuestionIds || []).map(
          (id) => allQuestions.find((q) => getQuestionKey(q) === id || q.id === id)?._internalKey ?? id
        );
        break;

      case 'filtered':
        const filtered = this.filterQuestions(allQuestions, config.filters);
        selectedQuestionIds = fisherYatesShuffle(filtered.map((q) => getQuestionKey(q))).slice(
          0,
          config.numberOfQuestions
        );
        break;
    }

    // Limit to configured number
    selectedQuestionIds = selectedQuestionIds.slice(0, config.numberOfQuestions);

    // Shuffle questions if enabled
    if (config.shuffleQuestions) {
      selectedQuestionIds = fisherYatesShuffle(selectedQuestionIds);
    }

    // Prepare option orders for each question
    const optionOrders = new Map<string, number[]>();
    const questionMap = new Map(allQuestions.map((q) => [getQuestionKey(q), q]));

    selectedQuestionIds.forEach((qId) => {
      const question = questionMap.get(qId);
      if (question) {
        if (config.shuffleOptions) {
          // Create shuffled option indices but track the correct answer
          const indices = Array.from({ length: question.options.length }, (_, i) => i);
          const shuffled = fisherYatesShuffle(indices);
          optionOrders.set(qId, shuffled);
        } else {
          // No shuffle - identity mapping
          const indices = Array.from({ length: question.options.length }, (_, i) => i);
          optionOrders.set(qId, indices);
        }
      }
    });

    const now = Date.now();

    const session: TestSession = {
      id: `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
      configId: config.id,
      questionIds: selectedQuestionIds,
      optionOrders,
      currentQuestionIndex: 0,
      answers: new Map(),
      visitedQuestions: new Set(),
      startTime: now,
      remainingTimeMs: config.timeLimit * 60 * 1000,
      isSubmitted: false,
      isPaused: false,
      createdAt: now,
      updatedAt: now,
    };

    return session;
  }

  /**
   * Filter questions based on criteria
   */
  private static filterQuestions(
    questions: Question[],
    filters?: {
      subjects?: string[];
      topics?: string[];
      difficulties?: string[];
      tags?: string[];
    }
  ): Question[] {
    if (!filters) return questions;

    return questions.filter((q) => {
      if (filters.subjects && filters.subjects.length > 0) {
        if (!q.subject || !filters.subjects.includes(q.subject)) {
          return false;
        }
      }

      if (filters.topics && filters.topics.length > 0) {
        if (!q.topic || !filters.topics.includes(q.topic)) {
          return false;
        }
      }

      if (filters.difficulties && filters.difficulties.length > 0) {
        if (!q.difficulty || !filters.difficulties.includes(q.difficulty)) {
          return false;
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        if (!q.tags || !q.tags.some((tag) => filters.tags!.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Select an answer for a question
   */
  static selectAnswer(
    session: TestSession,
    questionId: string,
    optionIndex: number
  ): TestSession {
    const newSession = this.cloneSession(session);

    const answer: TestAnswer = {
      questionId,
      selectedOptionIndex: optionIndex,
      isMarkedForReview: newSession.answers.get(questionId)?.isMarkedForReview ?? false,
    };

    newSession.answers.set(questionId, answer);
    newSession.visitedQuestions.add(questionId);
    newSession.updatedAt = Date.now();

    return newSession;
  }

  /**
   * Clear answer for a question
   */
  static clearAnswer(session: TestSession, questionId: string): TestSession {
    const newSession = this.cloneSession(session);
    newSession.answers.delete(questionId);
    newSession.updatedAt = Date.now();
    return newSession;
  }

  /**
   * Toggle mark for review
   */
  static toggleReview(session: TestSession, questionId: string): TestSession {
    const newSession = this.cloneSession(session);

    const answer = newSession.answers.get(questionId) ?? {
      questionId,
      selectedOptionIndex: null,
      isMarkedForReview: false,
    };

    answer.isMarkedForReview = !answer.isMarkedForReview;
    newSession.answers.set(questionId, answer);
    newSession.updatedAt = Date.now();

    return newSession;
  }

  /**
   * Move to next question
   */
  static nextQuestion(session: TestSession): TestSession {
    const newSession = this.cloneSession(session);
    if (newSession.currentQuestionIndex < newSession.questionIds.length - 1) {
      newSession.currentQuestionIndex++;
      newSession.updatedAt = Date.now();
    }
    return newSession;
  }

  /**
   * Move to previous question
   */
  static previousQuestion(session: TestSession): TestSession {
    const newSession = this.cloneSession(session);
    if (newSession.currentQuestionIndex > 0) {
      newSession.currentQuestionIndex--;
      newSession.updatedAt = Date.now();
    }
    return newSession;
  }

  /**
   * Jump to a specific question
   */
  static jumpToQuestion(session: TestSession, questionIndex: number): TestSession {
    const newSession = this.cloneSession(session);
    if (questionIndex >= 0 && questionIndex < newSession.questionIds.length) {
      newSession.currentQuestionIndex = questionIndex;
      newSession.updatedAt = Date.now();
    }
    return newSession;
  }

  /**
   * Calculate remaining time
   */
  static calculateRemainingTime(session: TestSession): number {
    const elapsed = Date.now() - session.startTime;
    return Math.max(0, session.remainingTimeMs - elapsed);
  }

  /**
   * Submit test and generate result
   */
  static async submitTest(
    session: TestSession,
    config: TestConfiguration,
    questions: Question[]
  ): Promise<TestResult> {
    const questionMap = new Map(questions.map((q) => [getQuestionKey(q), q]));
    const questionResults: QuestionResult[] = [];

    let totalMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    session.questionIds.forEach((qId) => {
      const question = questionMap.get(qId);
      if (!question) return;

      const answer = session.answers.get(qId);
      const optionOrder = session.optionOrders.get(qId) || [];

      let selected: number | null = null;
      let isCorrect = false;
      let marksObtained = 0;
      const marksPerCorrect = config.marksPerCorrect ?? question.marks ?? 1;
      const negativeMarks = config.negativeMarking ?? question.negativeMarks ?? 0;

      if (answer && answer.selectedOptionIndex !== null) {
        // Map displayed option index back to original index
        selected = optionOrder[answer.selectedOptionIndex];

        isCorrect = selected === question.answer;

        if (isCorrect) {
          correctCount++;
          marksObtained = marksPerCorrect;
        } else {
          wrongCount++;
          marksObtained = -negativeMarks;
        }
      } else {
        unansweredCount++;
      }

      totalMarks += marksObtained;

      questionResults.push({
        questionId: qId,
        selected,
        correct: question.answer,
        isCorrect,
        marksObtained,
        maxMarks: marksPerCorrect,
        isMarkedForReview: answer?.isMarkedForReview || false,
      });
    });

    // Calculate percentage and accuracy
    let maxMarks = 0;
    session.questionIds.forEach((qId) => {
      const question = questionMap.get(qId);
      if (question) {
        maxMarks += config.marksPerCorrect ?? question.marks ?? 1;
      }
    });

    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    const accuracy = session.questionIds.length > 0 ? (correctCount / session.questionIds.length) * 100 : 0;
    const timeTaken = Math.floor((Date.now() - session.startTime) / 1000);

    const result: TestResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      configId: config.id,
      testName: config.name,
      totalQuestions: session.questionIds.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unansweredQuestions: unansweredCount,
      totalMarks,
      maxMarks,
      percentage,
      accuracy,
      timeTaken,
      questionResults,
      submittedAt: Date.now(),
    };

    return result;
  }

  /**
   * Get question with properly ordered options
   */
  static getDisplayQuestion(
    questionId: string,
    question: Question,
    session: TestSession
  ): { question: Question; displayOptionIndices: number[] } {
    const optionOrder = session.optionOrders.get(questionId) || [];

    // Create display version with reordered options
    const displayQuestion: Question = {
      ...question,
      options: optionOrder.map((i) => question.options[i]),
      // Update answer index to match display order
      answer: optionOrder.indexOf(question.answer),
    };

    return {
      question: displayQuestion,
      displayOptionIndices: optionOrder,
    };
  }

  /**
   * Get answer state for display
   */
  static getAnswerState(
    session: TestSession,
    questionId: string
  ): { selected: number | null; isMarked: boolean } {
    const answer = session.answers.get(questionId);
    return {
      selected: answer?.selectedOptionIndex ?? null,
      isMarked: answer?.isMarkedForReview ?? false,
    };
  }

  /**
   * Helper to deep clone session
   */
  private static cloneSession(session: TestSession): TestSession {
    return {
      ...session,
      answers: new Map(session.answers),
      visitedQuestions: new Set(session.visitedQuestions),
      optionOrders: new Map(session.optionOrders),
    };
  }

  /**
   * Resume a test session
   */
  static async resumeTestSession(sessionId: string): Promise<TestSession | null> {
    const session = await storage.getTestSession(sessionId);
    if (!session) return null;

    // Update remaining time based on actual elapsed time
    const elapsed = Date.now() - session.startTime;
    session.remainingTimeMs = Math.max(0, session.remainingTimeMs - elapsed);

    return session;
  }

  /**
   * Get question statistics by metadata
   */
  static getStatisticsByMetadata(
    results: QuestionResult[],
    questions: Question[],
    metadataKey: 'subject' | 'topic' | 'difficulty'
  ): Record<string, { correct: number; wrong: number; unanswered: number; score: number }> {
    const stats: Record<string, { correct: number; wrong: number; unanswered: number; score: number }> = {};
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    results.forEach((result) => {
      const question = questionMap.get(result.questionId);
      if (!question) return;

      const key = (question as any)[metadataKey] || 'Unknown';

      if (!stats[key]) {
        stats[key] = { correct: 0, wrong: 0, unanswered: 0, score: 0 };
      }

      if (result.selected === null) {
        stats[key].unanswered++;
      } else if (result.isCorrect) {
        stats[key].correct++;
      } else {
        stats[key].wrong++;
      }

      stats[key].score += result.marksObtained;
    });

    return stats;
  }
}
