/**
 * Tests Page - List of Test Configurations
 */
import { storage } from '../storage/storage';
import { TestEngine } from '../engine/testEngine';
import { createHeader, createEmptyState, createLoadingSpinner } from '../components/common';
import { getCurrentStudent } from '../utils/studentAuth';
export async function createTestsPage() {
    const container = document.createElement('div');
    container.appendChild(createHeader());
    const main = document.createElement('main');
    main.className = 'main container';
    main.appendChild(createLoadingSpinner());
    try {
        const configs = await storage.getAllTestConfigs();
        main.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'flex justify-between align-center';
        header.style.marginBottom = '2rem';
        const title = document.createElement('h1');
        title.textContent = 'Tests';
        title.style.margin = '0';
        const createBtn = document.createElement('a');
        createBtn.href = '/tests/new';
        createBtn.setAttribute('data-link', '');
        createBtn.className = 'btn-primary';
        createBtn.textContent = '➕ Create New Test';
        header.appendChild(title);
        header.appendChild(createBtn);
        main.appendChild(header);
        if (configs.length === 0) {
            main.appendChild(createEmptyState('📝', 'No Tests', 'Create a test configuration to get started.'));
        }
        else {
            const testsList = document.createElement('div');
            testsList.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;';
            configs
                .sort((a, b) => b.createdAt - a.createdAt)
                .forEach((config) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.cursor = 'pointer';
                const cardTitle = document.createElement('h3');
                cardTitle.style.marginBottom = '0.5rem';
                cardTitle.textContent = config.name;
                const cardDesc = document.createElement('p');
                cardDesc.className = 'text-muted';
                cardDesc.style.fontSize = '0.9rem';
                cardDesc.style.marginBottom = '1rem';
                cardDesc.textContent = config.description || 'No description';
                const details = document.createElement('div');
                details.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
            font-size: 0.9rem;
          `;
                const addDetail = (label, value) => {
                    const item = document.createElement('div');
                    item.innerHTML = `<strong>${label}:</strong> ${value}`;
                    details.appendChild(item);
                };
                addDetail('Questions', config.numberOfQuestions.toString());
                addDetail('Time', `${config.timeLimit} min`);
                addDetail('Marks', `+${config.marksPerCorrect}`);
                addDetail('Negative', `-${config.negativeMarking}`);
                const actions = document.createElement('div');
                actions.className = 'btn-group';
                actions.style.cssText = 'width: 100%;';
                const startBtn = document.createElement('button');
                startBtn.type = 'button';
                startBtn.className = 'btn-primary';
                startBtn.style.cssText = 'text-align: center; flex: 1;';
                startBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const currentStudent = getCurrentStudent();
                    if (!currentStudent) {
                        window.history.pushState({}, '', '/login');
                        document.dispatchEvent(new Event('app:navigate'));
                        return;
                    }
                    try {
                        const questions = await storage.getAllQuestions();
                        const sessionData = await TestEngine.createTestSession(config, questions);
                        const session = { ...sessionData, studentId: currentStudent.id };
                        await storage.saveTestSession(session);
                        window.history.pushState({}, '', `/test/${session.id}`);
                        document.dispatchEvent(new Event('app:navigate'));
                    }
                    catch (error) {
                        console.error('Error starting test:', error);
                        alert('Unable to start this test. Please try again.');
                    }
                });
                startBtn.textContent = '▶️ Start';
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-secondary';
                editBtn.style.cssText = 'flex: 1;';
                editBtn.textContent = '✏️ Edit';
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // TODO: Navigate to edit page
                });
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-danger';
                deleteBtn.style.cssText = 'flex: 1;';
                deleteBtn.textContent = '🗑️';
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete test "${config.name}"?`)) {
                        await storage.deleteTestConfig(config.id);
                        window.location.reload();
                    }
                });
                actions.appendChild(startBtn);
                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                card.appendChild(cardTitle);
                card.appendChild(cardDesc);
                card.appendChild(details);
                card.appendChild(actions);
                testsList.appendChild(card);
            });
            main.appendChild(testsList);
        }
    }
    catch (error) {
        console.error('Error loading tests:', error);
        main.innerHTML = '';
        main.appendChild(createEmptyState('❌', 'Error', 'Failed to load tests. Please refresh the page.'));
    }
    container.appendChild(main);
    return container;
}
