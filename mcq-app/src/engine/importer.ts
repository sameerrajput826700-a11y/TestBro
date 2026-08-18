import type { Question, ImportValidationResult } from '../models/types';

export interface ParsedJsonData {
  questions: any[];
}

export class QuestionImporter {
  static parseJson(jsonContent: string): ParsedJsonData {
    const parsed = JSON.parse(jsonContent);

    let questions: any[] = [];

    // Handle array format
    if (Array.isArray(parsed)) {
      questions = parsed;
    }
    // Handle wrapped format
    else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else {
        throw new Error('Invalid JSON format. Expected array or object with "questions" property.');
      }
    } else {
      throw new Error('Invalid JSON format. Expected array or object.');
    }

    return { questions };
  }

  static validateQuestion(data: any): { isValid: boolean; question?: Question; error?: string } {
    try {
      // Check required fields
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Question must be an object' };
      }

      const question: Partial<Question> = {};

      // ID (optional, generate if missing)
      if (data.id) {
        if (typeof data.id !== 'string') {
          return { isValid: false, error: 'Question ID must be a string' };
        }
        question.id = data.id;
      } else {
        question.id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Question text (required)
      if (!data.question || typeof data.question !== 'string' || data.question.trim() === '') {
        return { isValid: false, error: 'Question text is required and must be non-empty string' };
      }
      question.question = data.question.trim();

      // Options (required)
      if (!Array.isArray(data.options) || data.options.length < 2) {
        return { isValid: false, error: 'At least 2 options are required' };
      }

      const validOptions = data.options
        .filter((opt: any) => opt !== null && opt !== undefined)
        .map((opt: any) => String(opt).trim())
        .filter((opt: string) => opt.length > 0);

      if (validOptions.length < 2) {
        return { isValid: false, error: 'At least 2 valid options are required' };
      }

      question.options = validOptions;

      // Answer index (required)
      if (typeof data.answer !== 'number') {
        return { isValid: false, error: 'Answer index must be a number' };
      }

      if (data.answer < 0 || data.answer >= validOptions.length) {
        return {
          isValid: false,
          error: `Answer index must be between 0 and ${validOptions.length - 1}`,
        };
      }

      question.answer = data.answer;

      // Optional fields
      if (data.explanation && typeof data.explanation === 'string') {
        question.explanation = data.explanation.trim();
      }

      if (data.subject && typeof data.subject === 'string') {
        question.subject = data.subject.trim();
      }

      if (data.topic && typeof data.topic === 'string') {
        question.topic = data.topic.trim();
      }

      if (data.difficulty && ['easy', 'medium', 'hard'].includes(data.difficulty)) {
        question.difficulty = data.difficulty;
      } else if (!data.difficulty) {
        question.difficulty = 'medium';
      }

      if (typeof data.marks === 'number' && data.marks > 0) {
        question.marks = data.marks;
      } else {
        question.marks = 1;
      }

      if (typeof data.negativeMarks === 'number' && data.negativeMarks >= 0) {
        question.negativeMarks = data.negativeMarks;
      } else {
        question.negativeMarks = 0.25;
      }

      if (Array.isArray(data.tags) && data.tags.every((t: any) => typeof t === 'string')) {
        question.tags = data.tags;
      }

      if (data.image && typeof data.image === 'string') {
        question.image = data.image;
      }

      if (data.source && typeof data.source === 'string') {
        question.source = data.source;
      }

      return { isValid: true, question: question as Question };
    } catch (error: any) {
      return { isValid: false, error: error.message || 'Unknown validation error' };
    }
  }

  static validateImport(jsonContent: string): ImportValidationResult {
    const result: ImportValidationResult = {
      valid: [],
      invalid: [],
      duplicateIds: [],
    };

    try {
      const parsed = this.parseJson(jsonContent);

      parsed.questions.forEach((questionData) => {
        const validation = this.validateQuestion(questionData);

        if (validation.isValid && validation.question) {
          const question = validation.question;
          result.valid.push(question);
        } else {
          result.invalid.push({
            data: questionData,
            error: validation.error || 'Unknown error',
          });
        }
      });

      return result;
    } catch (error: any) {
      result.invalid.push({
        data: null,
        error: `JSON parsing error: ${error.message}`,
      });
      return result;
    }
  }
}
