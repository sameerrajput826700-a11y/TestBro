/**
 * History Page - Test history and results management
 */
import { storage } from '../storage/storage';
import { createHeader, createEmptyState, createLoadingSpinner } from '../components/common';
import { formatTime, formatPercentage } from '../utils/helpers';
import { getCurrentStudent } from '../utils/studentAuth';
export async function createHistoryPage() {
    const container = document.createElement('div');
    container.appendChild(createHeader());
    const main = document.createElement('main');
    main.className = 'main container';
    main.appendChild(createLoadingSpinner());
    const currentStudent = getCurrentStudent();
    if (!currentStudent) {
        main.appendChild(createEmptyState('🔒', 'Login Required', 'Please log in to view your test history.'));
        const loginBtn = document.createElement('a');
        loginBtn.href = '/login';
        loginBtn.setAttribute('data-link', '');
        loginBtn.className = 'btn-primary';
        loginBtn.textContent = 'Login';
        main.appendChild(loginBtn);
        container.appendChild(main);
        return container;
    }
    try {
        const results = (await storage.getAllTestResults()).filter((result) => result.studentId === currentStudent.id);
        main.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'flex justify-between align-center';
        header.style.marginBottom = '2rem';
        const title = document.createElement('h1');
        title.textContent = 'Test History';
        title.style.margin = '0';
        const actions = document.createElement('div');
        const deleteAllBtn = document.createElement('button');
        deleteAllBtn.className = 'btn-danger';
        deleteAllBtn.textContent = '🗑️ Clear History';
        deleteAllBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete all test results? This cannot be undone.')) {
                await storage.deleteAllTestResults();
                window.location.reload();
            }
        });
        actions.appendChild(deleteAllBtn);
        header.appendChild(title);
        header.appendChild(actions);
        main.appendChild(header);
        if (results.length === 0) {
            main.appendChild(createEmptyState('📋', 'No Test History', 'You haven\'t taken any tests yet.'));
            const createBtn = document.createElement('a');
            createBtn.href = '/tests/new';
            createBtn.setAttribute('data-link', '');
            createBtn.className = 'btn-primary';
            createBtn.style.marginTop = '1rem';
            createBtn.textContent = '➕ Create Test';
            main.appendChild(createBtn);
        }
        else {
            // Stats
            const stats = document.createElement('div');
            stats.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      `;
            const createStat = (label, value) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.cssText = 'text-align: center;';
                card.innerHTML = `
          <div style="font-size: 1.5rem; font-weight: 600; color: #0066cc;">${value}</div>
          <div class="text-muted" style="font-size: 0.9rem;">${label}</div>
        `;
                return card;
            };
            const avgScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
            const bestScore = Math.max(...results.map((r) => r.percentage));
            stats.appendChild(createStat('Total Tests', results.length));
            stats.appendChild(createStat('Average Score', formatPercentage(avgScore)));
            stats.appendChild(createStat('Best Score', formatPercentage(bestScore)));
            main.appendChild(stats);
            // Results table
            const tableContainer = document.createElement('div');
            tableContainer.className = 'card';
            const table = document.createElement('table');
            table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
      `;
            // Header
            const thead = document.createElement('thead');
            thead.style.cssText = 'border-bottom: 2px solid #e0e0e0;';
            thead.innerHTML = `
        <tr>
          <th style="text-align: left; padding: 1rem; font-weight: 600;">Test Name</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Date</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Score</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Percentage</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Correct</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Wrong</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Time</th>
          <th style="text-align: center; padding: 1rem; font-weight: 600;">Action</th>
        </tr>
      `;
            table.appendChild(thead);
            const tbody = document.createElement('tbody');
            results
                .sort((a, b) => b.submittedAt - a.submittedAt)
                .forEach((result) => {
                const row = document.createElement('tr');
                row.style.cssText = 'border-bottom: 1px solid #e0e0e0;';
                const testNameCell = document.createElement('td');
                testNameCell.style.cssText = 'padding: 1rem; font-weight: 500;';
                testNameCell.textContent = result.testName;
                const dateCell = document.createElement('td');
                dateCell.style.cssText = 'padding: 1rem; text-align: center; font-size: 0.9rem;';
                dateCell.textContent = new Date(result.submittedAt).toLocaleDateString();
                const scoreCell = document.createElement('td');
                scoreCell.style.cssText = 'padding: 1rem; text-align: center; font-weight: 600;';
                scoreCell.textContent = `${result.totalMarks.toFixed(1)}/${result.maxMarks.toFixed(1)}`;
                const percentageCell = document.createElement('td');
                percentageCell.style.cssText = `
            padding: 1rem;
            text-align: center;
            font-weight: 600;
            color: ${result.percentage >= 50 ? '#26a626' : '#cc3333'};
          `;
                percentageCell.textContent = formatPercentage(result.percentage);
                const correctCell = document.createElement('td');
                correctCell.style.cssText = 'padding: 1rem; text-align: center; color: #26a626;';
                correctCell.textContent = result.correctAnswers.toString();
                const wrongCell = document.createElement('td');
                wrongCell.style.cssText = 'padding: 1rem; text-align: center; color: #cc3333;';
                wrongCell.textContent = result.wrongAnswers.toString();
                const timeCell = document.createElement('td');
                timeCell.style.cssText = 'padding: 1rem; text-align: center; font-size: 0.9rem;';
                timeCell.textContent = formatTime(result.timeTaken);
                const actionCell = document.createElement('td');
                actionCell.style.cssText = 'padding: 1rem; text-align: center;';
                const viewBtn = document.createElement('a');
                viewBtn.href = `/results/${result.id}`;
                viewBtn.setAttribute('data-link', '');
                viewBtn.textContent = 'View';
                viewBtn.style.cssText = `
            color: #0066cc;
            text-decoration: none;
            margin-right: 1rem;
          `;
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-danger btn-small';
                deleteBtn.textContent = '🗑️';
                deleteBtn.style.cssText = 'margin: 0; padding: 0.25rem 0.5rem;';
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`Delete result for "${result.testName}"?`)) {
                        await storage.deleteTestResult(result.id);
                        window.location.reload();
                    }
                });
                actionCell.appendChild(viewBtn);
                actionCell.appendChild(deleteBtn);
                row.appendChild(testNameCell);
                row.appendChild(dateCell);
                row.appendChild(scoreCell);
                row.appendChild(percentageCell);
                row.appendChild(correctCell);
                row.appendChild(wrongCell);
                row.appendChild(timeCell);
                row.appendChild(actionCell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            main.appendChild(tableContainer);
        }
    }
    catch (error) {
        console.error('Error loading history:', error);
        main.innerHTML = '';
        main.appendChild(createEmptyState('❌', 'Error', 'Failed to load history. Please refresh the page.'));
    }
    container.appendChild(main);
    return container;
}
