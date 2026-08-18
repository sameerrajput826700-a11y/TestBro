import type {
  Question,
  TestConfiguration,
  TestSession,
  TestResult,
  AppSettings,
} from '../models/types';

const DB_NAME = 'mcq_test_app';
const DB_VERSION = 2;

const STORES = {
  QUESTIONS: 'questions',
  TEST_CONFIGS: 'testConfigs',
  TEST_SESSIONS: 'testSessions',
  TEST_RESULTS: 'testResults',
  SETTINGS: 'settings',
};

class StorageManager {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Rebuild the questions store so duplicate IDs are allowed via an internal unique key.
        if (db.objectStoreNames.contains(STORES.QUESTIONS)) {
          db.deleteObjectStore(STORES.QUESTIONS);
        }
        db.createObjectStore(STORES.QUESTIONS, { keyPath: '_internalKey' });

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.TEST_CONFIGS)) {
          db.createObjectStore(STORES.TEST_CONFIGS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.TEST_SESSIONS)) {
          db.createObjectStore(STORES.TEST_SESSIONS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.TEST_RESULTS)) {
          db.createObjectStore(STORES.TEST_RESULTS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: 'readonly' | 'readwrite' = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.transaction([storeName], mode).objectStore(storeName);
  }

  // Questions
  async addQuestion(question: Question): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.QUESTIONS, 'readwrite');
      const internalKey =
        question._internalKey || `${question.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const questionWithKey = {
        ...question,
        _internalKey: internalKey,
      };
      const request = store.add(questionWithKey);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async addQuestions(questions: Question[]): Promise<void> {
    const store = this.getStore(STORES.QUESTIONS, 'readwrite');
    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      questions.forEach((question) => {
        const internalKey =
          question._internalKey || `${question.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const questionWithKey = {
          ...question,
          _internalKey: internalKey,
        };
        const request = store.add(questionWithKey);
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
        request.onsuccess = () => {
          completed++;
          if (completed === questions.length && !hasError) {
            resolve();
          }
        };
      });
    });
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.QUESTIONS);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result.find((q: any) => q.id === id || q._internalKey === id);
        resolve(result);
      };
    });
  }

  async getAllQuestions(): Promise<Question[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.QUESTIONS);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateQuestion(question: Question): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.QUESTIONS, 'readwrite');
      // Ensure _internalKey is preserved in the update
      const questionToUpdate = question as any;
      if (!questionToUpdate._internalKey) {
        questionToUpdate._internalKey = `${question.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const request = store.put(questionToUpdate);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteQuestion(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.QUESTIONS, 'readwrite');
      const getAllRequest = store.getAll();
      getAllRequest.onerror = () => reject(getAllRequest.error);
      getAllRequest.onsuccess = () => {
        const question = getAllRequest.result.find((q: any) => q.id === id);
        if (!question) {
          resolve();
          return;
        }
        const deleteRequest = store.delete(question._internalKey);
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onsuccess = () => resolve();
      };
    });
  }

  async deleteAllQuestions(): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.QUESTIONS, 'readwrite');
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Test Configurations
  async saveTestConfig(config: TestConfiguration): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_CONFIGS, 'readwrite');
      const request = store.put(config);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTestConfig(id: string): Promise<TestConfiguration | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_CONFIGS);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllTestConfigs(): Promise<TestConfiguration[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_CONFIGS);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteTestConfig(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_CONFIGS, 'readwrite');
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Test Sessions
  async saveTestSession(session: TestSession): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_SESSIONS, 'readwrite');
      const sessionData = this.serializeTestSession(session);
      const request = store.put(sessionData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTestSession(id: string): Promise<TestSession | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_SESSIONS);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? this.deserializeTestSession(result) : undefined);
      };
    });
  }

  async getAllTestSessions(): Promise<TestSession[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_SESSIONS);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result;
        resolve(results.map((r) => this.deserializeTestSession(r)));
      };
    });
  }

  async deleteTestSession(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_SESSIONS, 'readwrite');
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Test Results
  async saveTestResult(result: TestResult): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_RESULTS, 'readwrite');
      const request = store.put(result);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTestResult(id: string): Promise<TestResult | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_RESULTS);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllTestResults(): Promise<TestResult[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_RESULTS);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteTestResult(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_RESULTS, 'readwrite');
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteAllTestResults(): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.TEST_RESULTS, 'readwrite');
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Settings
  async saveSettings(settings: AppSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SETTINGS, 'readwrite');
      const request = store.put({ key: 'app_settings', ...settings });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSettings(): Promise<AppSettings | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.SETTINGS);
      const request = store.get('app_settings');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(undefined);
        } else {
          const { key, ...settings } = result;
          resolve(settings as AppSettings);
        }
      };
    });
  }

  // Serialization helpers
  private serializeTestSession(session: TestSession) {
    return {
      ...session,
      optionOrders: Array.from(session.optionOrders.entries()),
      answers: Array.from(session.answers.entries()),
      visitedQuestions: Array.from(session.visitedQuestions),
    };
  }

  private deserializeTestSession(data: any): TestSession {
    return {
      ...data,
      optionOrders: new Map(data.optionOrders),
      answers: new Map(data.answers),
      visitedQuestions: new Set(data.visitedQuestions),
    };
  }

  async clearAllData(): Promise<void> {
    for (const storeName of Object.values(STORES)) {
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }
}

export const storage = new StorageManager();
