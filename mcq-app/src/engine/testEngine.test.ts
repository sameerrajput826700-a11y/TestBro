import { describe, it, expect } from 'vitest';
import { TestEngine } from './testEngine';
import type { Question, TestConfiguration, TestSession } from '../models/types';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: '001',
    question: 'Sample question',
    options: ['A', 'B', 'C', 'D'],
    answer: 1,
    marks: 4,
    negativeMarks: 1,
    ...overrides,
  };
}

describe('TestEngine scoring and duplicate handling', () => {
  it('uses the test config marks for correct and wrong answers', async () => {
    const question = makeQuestion();
    const config: TestConfiguration = {
      id: 'cfg',
      name: 'Test',
      numberOfQuestions: 1,
      timeLimit: 10,
      marksPerCorrect: 4,
      negativeMarking: 1,
      passPercentage: 50,
      shuffleQuestions: false,
      shuffleOptions: false,
      showQuestionNumbers: true,
      allowNavigation: true,
      allowChangingAnswers: true,
      allowMarkForReview: true,
      autoSubmitOnTimeExpire: true,
      fullscreenMode: false,
      randomSelection: false,
      selectionMode: 'all',
      createdAt: Date.now(),
    };

    const session: TestSession = {
      id: 'session',
      configId: config.id,
      questionIds: ['001'],
      optionOrders: new Map([['001', [0, 1, 2, 3]]]),
      currentQuestionIndex: 0,
      answers: new Map([['001', { questionId: '001', selectedOptionIndex: 1, isMarkedForReview: false }]]),
      visitedQuestions: new Set(['001']),
      startTime: Date.now(),
      remainingTimeMs: 60000,
      isSubmitted: false,
      isPaused: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = await TestEngine.submitTest(session, config, [question]);

    expect(result.totalMarks).toBe(4);
    expect(result.maxMarks).toBe(4);
    expect(result.correctAnswers).toBe(1);
    expect(result.wrongAnswers).toBe(0);
  });

  it('keeps duplicate question ids distinct while preserving original ids for display', async () => {
    const q1 = makeQuestion({ id: '001', question: 'Question 1', answer: 0, _internalKey: 'internal_1' as any });
    const q2 = makeQuestion({ id: '001', question: 'Question 2', answer: 1, _internalKey: 'internal_2' as any });

    const config: TestConfiguration = {
      id: 'cfg2',
      name: 'Test',
      numberOfQuestions: 2,
      timeLimit: 10,
      marksPerCorrect: 4,
      negativeMarking: 1,
      passPercentage: 50,
      shuffleQuestions: false,
      shuffleOptions: false,
      showQuestionNumbers: true,
      allowNavigation: true,
      allowChangingAnswers: true,
      allowMarkForReview: true,
      autoSubmitOnTimeExpire: true,
      fullscreenMode: false,
      randomSelection: false,
      selectionMode: 'all',
      createdAt: Date.now(),
    };

    const session = {
      id: 'session2',
      configId: config.id,
      questionIds: ['internal_1', 'internal_2'],
      optionOrders: new Map([
        ['internal_1', [0, 1, 2, 3]],
        ['internal_2', [0, 1, 2, 3]],
      ]),
      currentQuestionIndex: 0,
      answers: new Map([
        ['internal_1', { questionId: 'internal_1', selectedOptionIndex: 0, isMarkedForReview: false }],
        ['internal_2', { questionId: 'internal_2', selectedOptionIndex: 1, isMarkedForReview: false }],
      ]),
      visitedQuestions: new Set(['internal_1', 'internal_2']),
      startTime: Date.now(),
      remainingTimeMs: 60000,
      isSubmitted: false,
      isPaused: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } satisfies TestSession;

    const result = await TestEngine.submitTest(session, config, [q1, q2]);

    expect(result.totalQuestions).toBe(2);
    expect(result.correctAnswers).toBe(2);
    expect(result.totalMarks).toBe(8);
  });
});
