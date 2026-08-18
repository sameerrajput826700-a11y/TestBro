/**
 * Dashboard Page
 */
import { storage } from '../storage/storage';
import { createHeader, createStatsCard, createEmptyState, createLoadingSpinner, } from '../components/common';
import { getCurrentStudent } from '../utils/studentAuth';
export async function createDashboardPage() {
    const container = document.createElement('div');
    // Add header
    container.appendChild(createHeader());
    const main = document.createElement('main');
    main.className = 'main container';
    const currentStudent = getCurrentStudent();
    if (!currentStudent) {
        main.appendChild(createEmptyState('🔒', 'Login Required', 'Please log in to access the student dashboard.'));
        const loginBtn = document.createElement('a');
        loginBtn.href = '/login';
        loginBtn.setAttribute('data-link', '');
        loginBtn.className = 'btn-primary';
        loginBtn.textContent = 'Login';
        main.appendChild(loginBtn);
        container.appendChild(main);
        return container;
    }
    // Add loading state initially
    main.appendChild(createLoadingSpinner());
    // Load data
    try {
        const questions = await storage.getAllQuestions();
        const results = await storage.getAllTestResults();
        const studentResults = results.filter((result) => result.studentId === currentStudent.id);
        // Clear loading spinner
        main.innerHTML = '';
        const pageTitle = document.createElement('h1');
        pageTitle.textContent = `Welcome, ${currentStudent.name}`;
        pageTitle.style.marginBottom = '0.5rem';
        main.appendChild(pageTitle);
        const studentMeta = document.createElement('p');
        studentMeta.className = 'text-muted';
        studentMeta.textContent = `Student ID: ${currentStudent.id}`;
        studentMeta.style.marginBottom = '2rem';
        main.appendChild(studentMeta);
        // Stats grid
        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    `;
        statsGrid.appendChild(createStatsCard('Total Questions', questions.length, '📚'));
        const totalTests = studentResults.length;
        statsGrid.appendChild(createStatsCard('Tests Taken', totalTests, '✔️'));
        const averageScore = totalTests > 0
            ? (studentResults.reduce((sum, r) => sum + r.percentage, 0) / totalTests).toFixed(1)
            : '0.0';
        statsGrid.appendChild(createStatsCard('Average Score', `${averageScore}%`, '📊'));
        const bestScore = totalTests > 0
            ? Math.max(...studentResults.map((r) => r.percentage)).toFixed(1)
            : '0.0';
        statsGrid.appendChild(createStatsCard('Best Score', `${bestScore}%`, '🏆'));
        main.appendChild(statsGrid);
        // Quick actions
        const actions = document.createElement('div');
        actions.className = 'card';
        actions.style.marginBottom = '2rem';
        const actionsTitle = document.createElement('h2');
        actionsTitle.textContent = 'Quick Actions';
        actionsTitle.style.marginBottom = '1rem';
        actions.appendChild(actionsTitle);
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group';
        buttonGroup.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    `;
        const createTestBtn = document.createElement('a');
        createTestBtn.href = '/tests/new';
        createTestBtn.setAttribute('data-link', '');
        createTestBtn.className = 'btn-primary';
        createTestBtn.style.cssText = 'text-align: center; padding: 1rem;';
        createTestBtn.textContent = '➕ Create Test';
        const importQBtn = document.createElement('a');
        importQBtn.href = '/questions/import';
        importQBtn.setAttribute('data-link', '');
        importQBtn.className = 'btn-secondary';
        importQBtn.style.cssText = 'text-align: center; padding: 1rem;';
        importQBtn.textContent = '📥 Import Questions';
        const bankBtn = document.createElement('a');
        bankBtn.href = '/questions';
        bankBtn.setAttribute('data-link', '');
        bankBtn.className = 'btn-secondary';
        bankBtn.style.cssText = 'text-align: center; padding: 1rem;';
        bankBtn.textContent = '📖 Question Bank';
        const historyBtn = document.createElement('a');
        historyBtn.href = '/history';
        historyBtn.setAttribute('data-link', '');
        historyBtn.className = 'btn-secondary';
        historyBtn.style.cssText = 'text-align: center; padding: 1rem;';
        historyBtn.textContent = '📋 History';
        buttonGroup.appendChild(createTestBtn);
        buttonGroup.appendChild(importQBtn);
        buttonGroup.appendChild(bankBtn);
        buttonGroup.appendChild(historyBtn);
        actions.appendChild(buttonGroup);
        main.appendChild(actions);
        // Recent tests
        if (studentResults.length > 0) {
            const recentSection = document.createElement('div');
            recentSection.className = 'card';
            const recentTitle = document.createElement('h2');
            recentTitle.textContent = 'Recent Tests';
            recentTitle.style.marginBottom = '1rem';
            recentSection.appendChild(recentTitle);
            const recentList = document.createElement('div');
            recentList.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';
            // Show last 5 tests
            studentResults
                .sort((a, b) => b.submittedAt - a.submittedAt)
                .slice(0, 5)
                .forEach((result) => {
                const item = document.createElement('div');
                item.style.cssText = `
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          `;
                const info = document.createElement('div');
                const name = document.createElement('div');
                name.style.fontWeight = '500';
                name.textContent = result.testName;
                const date = document.createElement('div');
                date.className = 'text-muted';
                date.style.fontSize = '0.9rem';
                date.textContent = new Date(result.submittedAt).toLocaleDateString();
                info.appendChild(name);
                info.appendChild(date);
                const score = document.createElement('div');
                score.style.fontWeight = '600';
                score.textContent = `${result.percentage.toFixed(1)}%`;
                item.appendChild(info);
                item.appendChild(score);
                recentList.appendChild(item);
            });
            recentSection.appendChild(recentList);
            main.appendChild(recentSection);
        }
        if (questions.length === 0) {
            const emptyContainer = document.createElement('div');
            emptyContainer.style.marginTop = '2rem';
            emptyContainer.appendChild(createEmptyState('📚', 'No Questions Yet', 'Import a question bank to get started.'));
            main.appendChild(emptyContainer);
        }
    }
    catch (error) {
        console.error('Error loading dashboard:', error);
        main.innerHTML = '';
        main.appendChild(createEmptyState('❌', 'Error', 'Failed to load dashboard. Please refresh the page.'));
    }
    container.appendChild(main);
    return container;
}
