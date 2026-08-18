/**
 * Main Application Entry Point
 */

import { Router } from './utils/router';
import { storage } from './storage/storage';
import { getCurrentStudent, clearCurrentStudent } from './utils/studentAuth';
import { createDashboardPage } from './pages/dashboard';
import { createImportPage } from './pages/import';
import { createStudentLoginPage } from './pages/login';

// Import pages
import { createQuestionsPage } from './pages/questions';
import { createTestsPage } from './pages/tests';
import { createNewTestPage } from './pages/testCreate';
import { createTestScreenPage } from './pages/testScreen';
import { createResultsPage } from './pages/results';
import { createHistoryPage } from './pages/history';
import { createSettingsPage } from './pages/settings';

async function initializeApp(): Promise<void> {
  // Initialize storage
  await storage.initialize();

  const appElement = document.getElementById('app');
  if (!appElement) {
    console.error('App container not found');
    return;
  }

  // Initialize router
  const router = new Router(appElement);

  // Register routes
  router.register('/login', createStudentLoginPage);
  router.register('/logout', async () => {
    clearCurrentStudent();
    window.history.pushState({}, '', '/login');
    document.dispatchEvent(new Event('app:navigate'));
    return document.createElement('div');
  });
  router.register('/dashboard', createDashboardPage);
  router.register('/questions', createQuestionsPage);
  router.register('/questions/import', createImportPage);
  router.register('/questions/new', createQuestionEditorPage);
  router.register('/questions/:id', createQuestionDetailPage);

  router.register('/tests/new', createNewTestPage);
  router.register('/tests', createTestsPage);
  router.register('/test/:sessionId', createTestScreenPage);

  router.register('/results/:resultId', createResultsPage);
  router.register('/history', createHistoryPage);

  router.register('/settings', createSettingsPage);
  router.register('/data', createDataManagementPage);

  const currentStudent = getCurrentStudent();
  if (!currentStudent && window.location.pathname !== '/login') {
    router.navigate('/login');
  } else if (currentStudent && window.location.pathname === '/login') {
    router.navigate('/dashboard');
  } else if (currentStudent) {
    router.navigate('/dashboard');
  } else {
    router.navigate('/login');
  }

  // Handle custom navigation event
  document.addEventListener('app:navigate', () => {
    const currentPath = window.location.pathname;
    router.navigate(currentPath);
  });

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme as 'light' | 'dark' | 'system');
}

function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  const body = document.body;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    body.setAttribute('data-theme', theme);
  }

  localStorage.setItem('theme', theme);
}

// Placeholder pages
async function createQuestionEditorPage(): Promise<HTMLElement> {
  const div = document.createElement('div');
  div.style.cssText = 'padding: 2rem; text-align: center;';
  div.innerHTML = `
    <h1>Add Question</h1>
    <p style="margin-top: 2rem; color: #666;">Feature coming soon...</p>
  `;
  return div;
}

async function createQuestionDetailPage(): Promise<HTMLElement> {
  const div = document.createElement('div');
  div.style.cssText = 'padding: 2rem; text-align: center;';
  div.innerHTML = `
    <h1>Question Details</h1>
    <p style="margin-top: 2rem; color: #666;">Feature coming soon...</p>
  `;
  return div;
}

async function createDataManagementPage(): Promise<HTMLElement> {
  const div = document.createElement('div');
  div.style.cssText = 'padding: 2rem; text-align: center;';
  div.innerHTML = `
    <h1>Data Management</h1>
    <p style="margin-top: 2rem; color: #666;">Feature coming soon...</p>
  `;
  return div;
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  initializeApp().catch(console.error);
});
