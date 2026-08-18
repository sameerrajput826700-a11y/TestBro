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
    constructor() {
        Object.defineProperty(this, "db", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
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
    getStore(storeName, mode = 'readonly') {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db.transaction([storeName], mode).objectStore(storeName);
    }
    // Questions
    async addQuestion(question) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.QUESTIONS, 'readwrite');
            const internalKey = question._internalKey || `${question.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const questionWithKey = {
                ...question,
                _internalKey: internalKey,
            };
            const request = store.add(questionWithKey);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async addQuestions(questions) {
        const store = this.getStore(STORES.QUESTIONS, 'readwrite');
        return new Promise((resolve, reject) => {
            let completed = 0;
            let hasError = false;
            questions.forEach((question) => {
                const internalKey = question._internalKey || `${question.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    async getQuestion(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.QUESTIONS);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result.find((q) => q.id === id || q._internalKey === id);
                resolve(result);
            };
        });
    }
    async getAllQuestions() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.QUESTIONS);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async updateQuestion(question) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.QUESTIONS, 'readwrite');
            // Ensure _internalKey is preserved in the update
            const questionToUpdate = question;
            if (!questionToUpdate._internalKey) {
                questionToUpdate._internalKey = `${question.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            const request = store.put(questionToUpdate);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async deleteQuestion(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.QUESTIONS, 'readwrite');
            const getAllRequest = store.getAll();
            getAllRequest.onerror = () => reject(getAllRequest.error);
            getAllRequest.onsuccess = () => {
                const question = getAllRequest.result.find((q) => q.id === id);
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
    async deleteAllQuestions() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.QUESTIONS, 'readwrite');
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    // Test Configurations
    async saveTestConfig(config) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_CONFIGS, 'readwrite');
            const request = store.put(config);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async getTestConfig(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_CONFIGS);
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async getAllTestConfigs() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_CONFIGS);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async deleteTestConfig(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_CONFIGS, 'readwrite');
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    // Test Sessions
    async saveTestSession(session) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_SESSIONS, 'readwrite');
            const sessionData = this.serializeTestSession(session);
            const request = store.put(sessionData);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async getTestSession(id) {
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
    async getAllTestSessions() {
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
    async deleteTestSession(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_SESSIONS, 'readwrite');
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    // Test Results
    async saveTestResult(result) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_RESULTS, 'readwrite');
            const request = store.put(result);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async getTestResult(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_RESULTS);
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async getAllTestResults() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_RESULTS);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
    async deleteTestResult(id) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_RESULTS, 'readwrite');
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async deleteAllTestResults() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.TEST_RESULTS, 'readwrite');
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    // Settings
    async saveSettings(settings) {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.SETTINGS, 'readwrite');
            const request = store.put({ key: 'app_settings', ...settings });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    async getSettings() {
        return new Promise((resolve, reject) => {
            const store = this.getStore(STORES.SETTINGS);
            const request = store.get('app_settings');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(undefined);
                }
                else {
                    const { key, ...settings } = result;
                    resolve(settings);
                }
            };
        });
    }
    // Serialization helpers
    serializeTestSession(session) {
        return {
            ...session,
            optionOrders: Array.from(session.optionOrders.entries()),
            answers: Array.from(session.answers.entries()),
            visitedQuestions: Array.from(session.visitedQuestions),
        };
    }
    deserializeTestSession(data) {
        return {
            ...data,
            optionOrders: new Map(data.optionOrders),
            answers: new Map(data.answers),
            visitedQuestions: new Set(data.visitedQuestions),
        };
    }
    async clearAllData() {
        for (const storeName of Object.values(STORES)) {
            await new Promise((resolve, reject) => {
                const store = this.getStore(storeName, 'readwrite');
                const request = store.clear();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        }
    }
}
export const storage = new StorageManager();
