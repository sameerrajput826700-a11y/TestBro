/**
 * Results Page - Test result and answer review
 */
import { storage } from '../storage/storage';
import { createHeader, createEmptyState } from '../components/common';
import { formatTime, formatPercentage } from '../utils/helpers';
import { getCurrentStudent } from '../utils/studentAuth';
export async function createResultsPage() {
    const container = document.createElement('div');
    container.appendChild(createHeader());
    const main = document.createElement('main');
    main.className = 'main container';
    const resultId = window.location.pathname.split('/').pop();
    if (!resultId) {
        main.appendChild(createEmptyState('❌', 'Error', 'Invalid result ID'));
        container.appendChild(main);
        return container;
    }
    try {
        const currentStudent = getCurrentStudent();
        const result = await storage.getTestResult(resultId);
        if (!result) {
            main.appendChild(createEmptyState('❌', 'Error', 'Result not found'));
            container.appendChild(main);
            return container;
        }
        if (currentStudent && result.studentId && result.studentId !== currentStudent.id) {
            main.appendChild(createEmptyState('🔒', 'Access Denied', 'This result belongs to another student.'));
            container.appendChild(main);
            return container;
        }
        const allQuestions = await storage.getAllQuestions();
        const questionMap = new Map(allQuestions.map((q) => [q._internalKey ?? q.id, q]));
        // Header
        const title = document.createElement('h1');
        title.textContent = `Test Result: ${result.testName}`;
        title.style.marginBottom = '0.5rem';
        main.appendChild(title);
        const reportSubtitle = document.createElement('p');
        reportSubtitle.className = 'text-muted';
        reportSubtitle.textContent = 'Progress Card and Detailed Analysis Report';
        reportSubtitle.style.marginBottom = '2rem';
        main.appendChild(reportSubtitle);
        // Score Section
        const scoreCard = document.createElement('div');
        scoreCard.className = 'card';
        scoreCard.style.marginBottom = '2rem';
        const scoreGrid = document.createElement('div');
        scoreGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      text-align: center;
      padding: 1rem 0;
    `;
        const createScoreStat = (label, value, color = '#0066cc') => {
            const stat = document.createElement('div');
            stat.innerHTML = `
        <div style="font-size: 2.5rem; font-weight: 700; color: ${color};">${value}</div>
        <div class="text-muted" style="font-size: 0.95rem; margin-top: 0.5rem;">${label}</div>
      `;
            return stat;
        };
        scoreGrid.appendChild(createScoreStat('Score', `${result.totalMarks.toFixed(1)}/${result.maxMarks.toFixed(1)}`));
        scoreGrid.appendChild(createScoreStat('Percentage', formatPercentage(result.percentage), '#26a626'));
        scoreGrid.appendChild(createScoreStat('Accuracy', formatPercentage(result.accuracy), '#ff9800'));
        scoreCard.appendChild(scoreGrid);
        main.appendChild(scoreCard);
        // Statistics
        const statsCard = document.createElement('div');
        statsCard.className = 'card';
        statsCard.style.marginBottom = '2rem';
        const statsTitle = document.createElement('h2');
        statsTitle.textContent = 'Statistics';
        statsTitle.style.marginBottom = '1.5rem';
        statsCard.appendChild(statsTitle);
        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    `;
        const createStatItem = (label, value) => {
            const item = document.createElement('div');
            item.style.cssText = `
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 6px;
      `;
            item.innerHTML = `
        <div class="text-muted" style="font-size: 0.9rem;">${label}</div>
        <div style="font-size: 1.3rem; font-weight: 600; margin-top: 0.5rem;">${value}</div>
      `;
            return item;
        };
        statsGrid.appendChild(createStatItem('Correct', result.correctAnswers));
        statsGrid.appendChild(createStatItem('Wrong', result.wrongAnswers));
        statsGrid.appendChild(createStatItem('Unattempted', result.unansweredQuestions));
        statsGrid.appendChild(createStatItem('Time Taken', formatTime(result.timeTaken)));
        statsCard.appendChild(statsGrid);
        main.appendChild(statsCard);
        // Analysis by Subject/Topic
        const subjects = new Map();
        const topics = new Map();
        const difficulties = new Map();
        result.questionResults.forEach((qResult) => {
            const question = questionMap.get(qResult.questionId);
            if (!question)
                return;
            // By subject
            if (question.subject) {
                const stats = subjects.get(question.subject) || {
                    correct: 0,
                    wrong: 0,
                    unanswered: 0,
                    score: 0,
                };
                if (qResult.selected === null) {
                    stats.unanswered++;
                }
                else if (qResult.isCorrect) {
                    stats.correct++;
                }
                else {
                    stats.wrong++;
                }
                stats.score += qResult.marksObtained;
                subjects.set(question.subject, stats);
            }
            // By topic
            if (question.topic) {
                const stats = topics.get(question.topic) || {
                    correct: 0,
                    wrong: 0,
                    unanswered: 0,
                    score: 0,
                };
                if (qResult.selected === null) {
                    stats.unanswered++;
                }
                else if (qResult.isCorrect) {
                    stats.correct++;
                }
                else {
                    stats.wrong++;
                }
                stats.score += qResult.marksObtained;
                topics.set(question.topic, stats);
            }
            // By difficulty
            if (question.difficulty) {
                const stats = difficulties.get(question.difficulty) || {
                    correct: 0,
                    wrong: 0,
                    unanswered: 0,
                    score: 0,
                };
                if (qResult.selected === null) {
                    stats.unanswered++;
                }
                else if (qResult.isCorrect) {
                    stats.correct++;
                }
                else {
                    stats.wrong++;
                }
                stats.score += qResult.marksObtained;
                difficulties.set(question.difficulty, stats);
            }
        });
        const analysisCard = document.createElement('div');
        analysisCard.className = 'card';
        analysisCard.style.marginBottom = '2rem';
        const analysisTitle = document.createElement('h2');
        analysisTitle.textContent = 'Performance Analysis';
        analysisTitle.style.marginBottom = '1.5rem';
        analysisCard.appendChild(analysisTitle);
        const analysisTabs = document.createElement('div');
        analysisTabs.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e0e0e0;';
        const createTab = (label, _data, active = false) => {
            const tab = document.createElement('button');
            tab.textContent = label;
            tab.style.cssText = `
        padding: 0.75rem 1.5rem;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: 500;
        border-bottom: 3px solid ${active ? '#0066cc' : 'transparent'};
        color: ${active ? '#0066cc' : '#666'};
      `;
            tab.addEventListener('click', () => {
                document.querySelectorAll('[data-analysis-panel]').forEach((p) => {
                    const elem = p;
                    elem.style.display = 'none';
                });
                const panel = document.getElementById(`panel-${label}`);
                if (panel)
                    panel.style.display = 'block';
            });
            return tab;
        };
        analysisTabs.appendChild(createTab('By Subject', subjects, true));
        analysisTabs.appendChild(createTab('By Topic', topics));
        analysisTabs.appendChild(createTab('By Difficulty', difficulties));
        analysisCard.appendChild(analysisTabs);
        const createAnalysisPanel = (label, data) => {
            const panel = document.createElement('div');
            panel.id = `panel-${label}`;
            panel.setAttribute('data-analysis-panel', '');
            panel.style.display = label === 'By Subject' ? 'block' : 'none';
            if (data.size === 0) {
                panel.innerHTML = '<p class="text-muted">No data</p>';
            }
            else {
                const items = document.createElement('div');
                items.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';
                Array.from(data.entries()).forEach(([key, stats]) => {
                    const item = document.createElement('div');
                    item.style.cssText = 'padding: 1rem; background: #f5f5f5; border-radius: 6px;';
                    const itemTitle = document.createElement('div');
                    itemTitle.style.cssText = 'font-weight: 600; margin-bottom: 0.5rem;';
                    itemTitle.textContent = key;
                    const itemStats = document.createElement('div');
                    itemStats.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; font-size: 0.9rem;';
                    itemStats.innerHTML = `
            <div><span class="text-muted">Correct:</span> <strong style="color: #26a626;">${stats.correct}</strong></div>
            <div><span class="text-muted">Wrong:</span> <strong style="color: #cc3333;">${stats.wrong}</strong></div>
            <div><span class="text-muted">Unanswered:</span> <strong>${stats.unanswered}</strong></div>
            <div><span class="text-muted">Score:</span> <strong>${stats.score.toFixed(1)}</strong></div>
          `;
                    item.appendChild(itemTitle);
                    item.appendChild(itemStats);
                    items.appendChild(item);
                });
                panel.appendChild(items);
            }
            return panel;
        };
        analysisCard.appendChild(createAnalysisPanel('By Subject', subjects));
        analysisCard.appendChild(createAnalysisPanel('By Topic', topics));
        analysisCard.appendChild(createAnalysisPanel('By Difficulty', difficulties));
        main.appendChild(analysisCard);
        // Answer Review
        const reviewCard = document.createElement('div');
        reviewCard.className = 'card';
        const reviewTitle = document.createElement('h2');
        reviewTitle.textContent = 'Answer Review';
        reviewTitle.style.marginBottom = '1rem';
        reviewCard.appendChild(reviewTitle);
        const filterDiv = document.createElement('div');
        filterDiv.style.cssText = 'margin-bottom: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;';
        const createFilterBtn = (label, filter, active = false) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = `
        padding: 0.5rem 1rem;
        border: 1px solid ${active ? '#0066cc' : '#ddd'};
        background: ${active ? '#0066cc' : 'white'};
        color: ${active ? 'white' : '#333'};
        border-radius: 4px;
        cursor: pointer;
      `;
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-filter-btn]').forEach((b) => {
                    const btnElem = b;
                    btnElem.style.borderColor = '#ddd';
                    btnElem.style.backgroundColor = 'white';
                    btnElem.style.color = '#333';
                });
                btn.style.borderColor = '#0066cc';
                btn.style.backgroundColor = '#0066cc';
                btn.style.color = 'white';
                document.querySelectorAll('[data-question-result]').forEach((q) => {
                    const qElem = q;
                    if (filter === 'all') {
                        qElem.style.display = 'block';
                    }
                    else {
                        qElem.style.display = qElem.getAttribute('data-type') === filter ? 'block' : 'none';
                    }
                });
            });
            btn.setAttribute('data-filter-btn', '');
            return btn;
        };
        filterDiv.appendChild(createFilterBtn('All', 'all', true));
        filterDiv.appendChild(createFilterBtn('Correct', 'correct'));
        filterDiv.appendChild(createFilterBtn('Incorrect', 'incorrect'));
        filterDiv.appendChild(createFilterBtn('Unanswered', 'unanswered'));
        reviewCard.appendChild(filterDiv);
        const reviewList = document.createElement('div');
        reviewList.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';
        result.questionResults.forEach((qResult, idx) => {
            const question = questionMap.get(qResult.questionId);
            if (!question)
                return;
            const resultType = qResult.selected === null ? 'unanswered' : qResult.isCorrect ? 'correct' : 'incorrect';
            const item = document.createElement('div');
            item.setAttribute('data-question-result', '');
            item.setAttribute('data-type', resultType);
            item.style.cssText = `
        padding: 1rem;
        border: 2px solid ${qResult.isCorrect ? '#d4edda' : qResult.selected === null ? '#fff3cd' : '#ffebee'};
        border-radius: 6px;
        background: ${qResult.isCorrect ? '#f1f8f5' : qResult.selected === null ? '#fffdf0' : '#fff5f5'};
      `;
            const qHeader = document.createElement('div');
            qHeader.style.cssText = 'margin-bottom: 1rem;';
            qHeader.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 0.25rem;">Q${idx + 1}. ${question.question}</div>
        <div style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #666;">Marks: <strong>${qResult.marksObtained.toFixed(1)}/${qResult.maxMarks.toFixed(1)}</strong></div>
      `;
            const optionsDiv = document.createElement('div');
            optionsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;';
            question.options.forEach((opt, optIdx) => {
                const optEl = document.createElement('div');
                optEl.style.cssText = `
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.9rem;
          background: white;
          ${qResult.correct === optIdx ? 'border-left: 4px solid #26a626;' : ''}
          ${qResult.selected === optIdx && qResult.correct !== optIdx ? 'border-left: 4px solid #cc3333;' : ''}
        `;
                let text = `${String.fromCharCode(65 + optIdx)}. ${opt}`;
                if (qResult.correct === optIdx) {
                    text += ' ✓ Correct';
                    optEl.style.backgroundColor = '#f0fdf4';
                }
                if (qResult.selected === optIdx && qResult.correct !== optIdx) {
                    text += ' ✗ Your Answer';
                    optEl.style.backgroundColor = '#fef5f5';
                }
                optEl.textContent = text;
                optionsDiv.appendChild(optEl);
            });
            if (qResult.selected === null) {
                const unansweredEl = document.createElement('div');
                unansweredEl.style.cssText = 'padding: 0.75rem; background: #fff9e6; border-left: 4px solid #ff9800; border-radius: 4px;';
                unansweredEl.textContent = 'Unanswered';
                optionsDiv.appendChild(unansweredEl);
            }
            qHeader.appendChild(optionsDiv);
            item.appendChild(qHeader);
            if (question.explanation) {
                const expDiv = document.createElement('div');
                expDiv.style.cssText = 'background: white; padding: 0.75rem; border-radius: 4px; font-size: 0.9rem;';
                expDiv.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
                item.appendChild(expDiv);
            }
            reviewList.appendChild(item);
        });
        reviewCard.appendChild(reviewList);
        main.appendChild(reviewCard);
        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'btn-group no-print';
        actions.style.marginTop = '2rem';
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-primary';
        exportBtn.type = 'button';
        exportBtn.textContent = '📄 Download Progress Card';
        exportBtn.addEventListener('click', () => {
            const originalTitle = document.title;
            document.title = `${result.testName} - Progress Card`;
            window.print();
            window.setTimeout(() => {
                document.title = originalTitle;
            }, 500);
        });
        const homeBtn = document.createElement('a');
        homeBtn.href = '/dashboard';
        homeBtn.setAttribute('data-link', '');
        homeBtn.className = 'btn-primary';
        homeBtn.textContent = '🏠 Dashboard';
        const historyBtn = document.createElement('a');
        historyBtn.href = '/history';
        historyBtn.setAttribute('data-link', '');
        historyBtn.className = 'btn-secondary';
        historyBtn.textContent = '📋 History';
        actions.appendChild(exportBtn);
        actions.appendChild(homeBtn);
        actions.appendChild(historyBtn);
        main.appendChild(actions);
    }
    catch (error) {
        console.error('Error loading result:', error);
        main.appendChild(createEmptyState('❌', 'Error', 'Failed to load result. Please refresh the page.'));
    }
    container.appendChild(main);
    return container;
}
