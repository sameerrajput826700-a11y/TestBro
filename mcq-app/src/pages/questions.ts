/**
 * Questions (Question Bank) Page
 */

import { storage } from '../storage/storage';
import { createHeader, createEmptyState, createLoadingSpinner } from '../components/common';

export async function createQuestionsPage(): Promise<HTMLElement> {
  const container = document.createElement('div');
  container.appendChild(createHeader());

  const main = document.createElement('main');
  main.className = 'main container';

  main.appendChild(createLoadingSpinner());

  try {
    const questions = await storage.getAllQuestions();

    main.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'flex justify-between align-center';
    header.style.marginBottom = '2rem';

    const title = document.createElement('h1');
    title.textContent = 'Question Bank';
    title.style.margin = '0';

    const actions = document.createElement('div');
    actions.className = 'btn-group';

    const importBtn = document.createElement('a');
    importBtn.href = '/questions/import';
    importBtn.setAttribute('data-link', '');
    importBtn.className = 'btn-primary';
    importBtn.textContent = '📥 Import Questions';

    const addBtn = document.createElement('a');
    addBtn.href = '/questions/new';
    addBtn.setAttribute('data-link', '');
    addBtn.className = 'btn-secondary';
    addBtn.textContent = '➕ Add Question';

    actions.appendChild(importBtn);
    actions.appendChild(addBtn);

    header.appendChild(title);
    header.appendChild(actions);
    main.appendChild(header);

    if (questions.length === 0) {
      main.appendChild(
        createEmptyState(
          '📚',
          'No Questions Found',
          'Import questions or create a new question to get started.'
        )
      );
    } else {
      // Stats
      const stats = document.createElement('div');
      stats.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      `;

      const subjects = new Set(questions.map((q) => q.subject).filter(Boolean));
      const topics = new Set(questions.map((q) => q.topic).filter(Boolean));
      const difficulties = new Set(questions.map((q) => q.difficulty).filter(Boolean));

      const createStatCard = (label: string, value: number) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'text-align: center;';
        card.innerHTML = `
          <div style="font-size: 1.5rem; font-weight: 600; color: #0066cc;">${value}</div>
          <div class="text-muted" style="font-size: 0.9rem;">${label}</div>
        `;
        return card;
      };

      stats.appendChild(createStatCard('Total Questions', questions.length));
      stats.appendChild(createStatCard('Subjects', subjects.size));
      stats.appendChild(createStatCard('Topics', topics.size));
      stats.appendChild(createStatCard('Difficulty Levels', difficulties.size));

      main.appendChild(stats);

      // Filters
      const filterDiv = document.createElement('div');
      filterDiv.className = 'card';
      filterDiv.style.marginBottom = '2rem';

      const filterTitle = document.createElement('h3');
      filterTitle.textContent = 'Filters';
      filterTitle.style.marginBottom = '1rem';
      filterDiv.appendChild(filterTitle);

      const filterGrid = document.createElement('div');
      filterGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      `;

      // Subject filter
      const subjectGroup = document.createElement('div');
      const subjectLabel = document.createElement('label');
      subjectLabel.style.fontWeight = '500';
      subjectLabel.style.marginBottom = '0.5rem';
      subjectLabel.style.display = 'block';
      subjectLabel.textContent = 'Subject';
      const subjectSelect = document.createElement('select');
      subjectSelect.style.width = '100%';
      subjectSelect.innerHTML = '<option value="">All Subjects</option>';
      subjects.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s || '';
        opt.textContent = s || 'Unknown';
        subjectSelect.appendChild(opt);
      });
      subjectGroup.appendChild(subjectLabel);
      subjectGroup.appendChild(subjectSelect);
      filterGrid.appendChild(subjectGroup);

      // Difficulty filter
      const diffGroup = document.createElement('div');
      const diffLabel = document.createElement('label');
      diffLabel.style.fontWeight = '500';
      diffLabel.style.marginBottom = '0.5rem';
      diffLabel.style.display = 'block';
      diffLabel.textContent = 'Difficulty';
      const diffSelect = document.createElement('select');
      diffSelect.style.width = '100%';
      diffSelect.innerHTML = '<option value="">All Levels</option>';
      const diffLevels = Array.from(difficulties);
      diffLevels.sort().forEach((d) => {
        const opt = document.createElement('option');
        opt.value = d || '';
        opt.textContent = (d || 'Unknown').charAt(0).toUpperCase() + (d || 'unknown').slice(1);
        diffSelect.appendChild(opt);
      });
      diffGroup.appendChild(diffLabel);
      diffGroup.appendChild(diffSelect);
      filterGrid.appendChild(diffGroup);

      // Search
      const searchGroup = document.createElement('div');
      const searchLabel = document.createElement('label');
      searchLabel.style.fontWeight = '500';
      searchLabel.style.marginBottom = '0.5rem';
      searchLabel.style.display = 'block';
      searchLabel.textContent = 'Search';
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search questions...';
      searchInput.style.width = '100%';
      searchGroup.appendChild(searchLabel);
      searchGroup.appendChild(searchInput);
      filterGrid.appendChild(searchGroup);

      filterDiv.appendChild(filterGrid);
      main.appendChild(filterDiv);

      // Questions list
      const listDiv = document.createElement('div');
      listDiv.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

      function updateList() {
        listDiv.innerHTML = '';

        let filtered = questions;

        const subject = subjectSelect.value;
        if (subject) {
          filtered = filtered.filter((q) => q.subject === subject);
        }

        const difficulty = diffSelect.value;
        if (difficulty) {
          filtered = filtered.filter((q) => q.difficulty === difficulty);
        }

        const search = searchInput.value.toLowerCase();
        if (search) {
          filtered = filtered.filter(
            (q) =>
              q.question.toLowerCase().includes(search) ||
              q.id.toLowerCase().includes(search) ||
              q.options.some((o) => o.toLowerCase().includes(search))
          );
        }

        if (filtered.length === 0) {
          listDiv.appendChild(
            createEmptyState('🔍', 'No Results', 'No questions match your filters.')
          );
        } else {
          filtered.forEach((question) => {
            const item = document.createElement('div');
            item.className = 'card';
            item.style.cursor = 'pointer';

            const qHeader = document.createElement('div');
            qHeader.style.cssText = `
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 0.5rem;
            `;

            const qTitle = document.createElement('div');
            const qId = document.createElement('div');
            qId.style.cssText = 'font-weight: 600; margin-bottom: 0.25rem;';
            qId.textContent = `${question.id}: ${question.question}`;

            const qMeta = document.createElement('div');
            qMeta.className = 'text-muted';
            qMeta.style.fontSize = '0.85rem';
            qMeta.innerHTML = `
              ${question.subject ? `<span>${question.subject}</span>` : ''}
              ${question.topic ? `<span> · ${question.topic}</span>` : ''}
              ${question.difficulty ? `<span> · ${question.difficulty}</span>` : ''}
            `;

            qTitle.appendChild(qId);
            qTitle.appendChild(qMeta);
            qHeader.appendChild(qTitle);

            const actions = document.createElement('div');
            actions.className = 'btn-group';
            actions.style.cssText = 'gap: 0.25rem;';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-secondary btn-small';
            editBtn.textContent = '✏️';
            editBtn.title = 'Edit';
            editBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              // TODO: Navigate to edit page
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger btn-small';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete';
            deleteBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              if (confirm(`Delete question "${question.question}"?`)) {
                await storage.deleteQuestion(question.id);
                updateList();
              }
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            qHeader.appendChild(actions);

            item.appendChild(qHeader);

            const optionsDiv = document.createElement('div');
            optionsDiv.style.cssText = 'margin-top: 1rem; display: grid; gap: 0.5rem;';

            question.options.forEach((opt, idx) => {
              const optEl = document.createElement('div');
              optEl.style.cssText = `
                padding: 0.5rem;
                background: ${idx === question.answer ? '#d4edda' : '#f5f5f5'};
                border-radius: 4px;
                font-size: 0.9rem;
              `;
              optEl.textContent = `${String.fromCharCode(65 + idx)}. ${opt}${idx === question.answer ? ' ✓' : ''}`;
              optionsDiv.appendChild(optEl);
            });

            item.appendChild(optionsDiv);

            if (question.explanation) {
              const expDiv = document.createElement('div');
              expDiv.style.cssText = `
                margin-top: 1rem;
                padding: 0.5rem;
                background: #e3f2fd;
                border-radius: 4px;
                font-size: 0.85rem;
              `;
              expDiv.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
              item.appendChild(expDiv);
            }

            listDiv.appendChild(item);
          });
        }
      }

      // Update list on filter changes
      subjectSelect.addEventListener('change', updateList);
      diffSelect.addEventListener('change', updateList);
      searchInput.addEventListener('input', updateList);

      main.appendChild(listDiv);
      updateList();
    }
  } catch (error) {
    console.error('Error loading questions:', error);
    main.innerHTML = '';
    main.appendChild(
      createEmptyState('❌', 'Error', 'Failed to load questions. Please refresh the page.')
    );
  }

  container.appendChild(main);
  return container;
}
