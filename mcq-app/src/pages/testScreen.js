/**
 * Test Screen Page - Main testing interface
 */
import { storage } from '../storage/storage';
import { TestEngine } from '../engine/testEngine';
import { Modal } from '../components/common';
import { formatTimerDisplay, showNotification } from '../utils/helpers';
import { getCurrentStudent } from '../utils/studentAuth';
export async function createTestScreenPage() {
    const container = document.createElement('div');
    // Extract sessionId from URL
    const sessionId = window.location.pathname.split('/').pop();
    if (!sessionId) {
        container.innerHTML = '<div class="container"><div class="alert alert-danger">Invalid session ID</div></div>';
        return container;
    }
    const currentStudent = getCurrentStudent();
    if (!currentStudent) {
        container.innerHTML = '<div class="container"><div class="alert alert-danger">Login required to attempt the test.</div><a href="/login" class="btn-primary" data-link>Go to Login</a></div>';
        return container;
    }
    try {
        const sessionData = await storage.getTestSession(sessionId);
        if (!sessionData) {
            container.innerHTML = '<div class="container"><div class="alert alert-danger">Test session not found</div></div>';
            return container;
        }
        if (sessionData.studentId && sessionData.studentId !== currentStudent.id) {
            container.innerHTML = '<div class="container"><div class="alert alert-danger">This test was started by another student.</div></div>';
            return container;
        }
        const activeSession = sessionData;
        const config = await storage.getTestConfig(activeSession.configId);
        const allQuestions = await storage.getAllQuestions();
        if (!config) {
            container.innerHTML = '<div class="container"><div class="alert alert-danger">Test configuration not found</div></div>';
            return container;
        }
        const activeConfig = config;
        // Build question map using the internal key so duplicate IDs still map to distinct questions.
        const questionMap = new Map(allQuestions.map((q) => [q._internalKey ?? q.id, q]));
        // Header
        const header = document.createElement('header');
        header.className = 'header';
        header.style.cssText = 'position: sticky; top: 0; z-index: 100;';
        const headerContent = document.createElement('div');
        headerContent.className = 'container flex justify-between align-center';
        headerContent.style.cssText = 'padding: 1rem 0;';
        const testName = document.createElement('h2');
        testName.style.cssText = 'margin: 0; font-size: 1.1rem;';
        testName.textContent = config.name;
        const timerDiv = document.createElement('div');
        timerDiv.id = 'timer';
        timerDiv.style.cssText = 'font-size: 1.2rem; font-weight: 600; font-family: monospace;';
        timerDiv.textContent = formatTimerDisplay(activeSession.remainingTimeMs);
        const submitDiv = document.createElement('div');
        const submitBtn = document.createElement('button');
        submitBtn.className = 'btn-danger';
        submitBtn.textContent = '📤 Submit Test';
        submitBtn.addEventListener('click', () => handleSubmitClick());
        submitDiv.appendChild(submitBtn);
        headerContent.appendChild(testName);
        headerContent.appendChild(timerDiv);
        headerContent.appendChild(submitDiv);
        header.appendChild(headerContent);
        container.appendChild(header);
        // Main content area
        const mainContent = document.createElement('div');
        mainContent.className = 'question-layout';
        mainContent.style.cssText = `
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
    `;
        // Question display area
        const questionArea = document.createElement('div');
        questionArea.id = 'questionArea';
        questionArea.className = 'question-panel';
        questionArea.style.cssText = 'background: white; padding: 2rem; border-radius: 8px; min-height: 600px;';
        // Question palette (sidebar)
        const palette = document.createElement('div');
        palette.id = 'questionPalette';
        palette.className = 'question-palette';
        palette.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 1rem;
      height: fit-content;
      position: sticky;
      top: 80px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    `;
        const paletteTitle = document.createElement('h3');
        paletteTitle.style.cssText = 'margin-top: 0; font-size: 0.95rem;';
        paletteTitle.textContent = 'Questions';
        palette.appendChild(paletteTitle);
        const paletteGrid = document.createElement('div');
        paletteGrid.id = 'paletteGrid';
        paletteGrid.className = 'palette-grid';
        paletteGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    `;
        palette.appendChild(paletteGrid);
        mainContent.appendChild(questionArea);
        mainContent.appendChild(palette);
        container.appendChild(mainContent);
        // Timer management
        let timeoutId = null;
        function updateTimer() {
            const remaining = TestEngine.calculateRemainingTime(activeSession);
            if (remaining <= 0) {
                if (timeoutId)
                    clearInterval(timeoutId);
                handleAutoSubmit();
                return;
            }
            const timerEl = document.getElementById('timer');
            if (timerEl) {
                timerEl.textContent = formatTimerDisplay(remaining);
            }
            // Warnings
            if (remaining < 60000 && remaining > 59000) {
                showNotification('⏰ 1 minute remaining!', 'warning', 2000);
            }
            else if (remaining < 300000 && remaining > 299000) {
                showNotification('⏰ 5 minutes remaining!', 'warning', 2000);
            }
            else if (remaining < 600000 && remaining > 599000) {
                showNotification('⏰ 10 minutes remaining!', 'warning', 2000);
            }
        }
        function startTimer() {
            updateTimer();
            timeoutId = setInterval(updateTimer, 1000);
        }
        // Display current question
        function displayQuestion(index) {
            const questionId = activeSession.questionIds[index];
            const question = questionMap.get(questionId);
            if (!question) {
                questionArea.innerHTML = '<div class="alert alert-danger">Question not found</div>';
                return;
            }
            const renderedQuestion = TestEngine.getDisplayQuestion(questionId, question, activeSession).question;
            const answerState = TestEngine.getAnswerState(activeSession, questionId);
            questionArea.innerHTML = '';
            // Question number and progress
            const progress = document.createElement('div');
            progress.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e0e0e0;
      `;
            const qNumber = document.createElement('h2');
            qNumber.style.cssText = 'margin: 0;';
            qNumber.textContent = `Question ${index + 1} of ${activeSession.questionIds.length}`;
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
        flex: 1;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        margin: 0 2rem;
        overflow: hidden;
      `;
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
        height: 100%;
        width: ${((index + 1) / activeSession.questionIds.length) * 100}%;
        background: #0066cc;
        transition: width 0.3s;
      `;
            progressBar.appendChild(progressFill);
            progress.appendChild(qNumber);
            progress.appendChild(progressBar);
            questionArea.appendChild(progress);
            // Question text
            const qText = document.createElement('h3');
            qText.style.cssText = 'font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;';
            qText.textContent = renderedQuestion.question;
            questionArea.appendChild(qText);
            // Options
            const optionsDiv = document.createElement('div');
            optionsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;';
            renderedQuestion.options.forEach((option, displayIdx) => {
                const label = document.createElement('label');
                label.className = 'answer-option';
                label.style.cssText = `
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 56px;
          width: 100%;
        `;
                if (answerState.selected === displayIdx) {
                    label.style.borderColor = '#0066cc';
                    label.style.backgroundColor = '#f0f7ff';
                }
                label.addEventListener('mouseenter', () => {
                    if (answerState.selected !== displayIdx) {
                        label.style.borderColor = '#ccc';
                    }
                });
                label.addEventListener('mouseleave', () => {
                    if (answerState.selected !== displayIdx) {
                        label.style.borderColor = '#e0e0e0';
                    }
                });
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question_${questionId}`;
                radio.value = displayIdx.toString();
                radio.checked = answerState.selected === displayIdx;
                radio.style.cssText = 'margin-top: 0.25rem; cursor: pointer;';
                radio.addEventListener('change', () => {
                    const newSession = TestEngine.selectAnswer(activeSession, questionId, displayIdx);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(index);
                });
                const optionText = document.createElement('span');
                optionText.className = 'answer-option-text';
                optionText.style.cssText = 'flex: 1; line-height: 1.5;';
                optionText.innerHTML = `<strong>${String.fromCharCode(65 + displayIdx)}.</strong> ${option}`;
                label.appendChild(radio);
                label.appendChild(optionText);
                optionsDiv.appendChild(label);
            });
            questionArea.appendChild(optionsDiv);
            // Explanation (only show if we need to)
            if (renderedQuestion.explanation) {
                const expDiv = document.createElement('div');
                expDiv.style.cssText = `
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        `;
                expDiv.innerHTML = `<strong>Explanation:</strong> ${renderedQuestion.explanation}`;
                questionArea.appendChild(expDiv);
            }
            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'btn-group';
            actions.style.cssText = 'margin-top: 2rem;';
            if (index > 0) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'btn-secondary';
                prevBtn.textContent = '⬅️ Previous';
                prevBtn.addEventListener('click', () => {
                    const newSession = TestEngine.previousQuestion(activeSession);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(newSession.currentQuestionIndex);
                });
                actions.appendChild(prevBtn);
            }
            if (activeConfig.allowMarkForReview) {
                const markBtn = document.createElement('button');
                markBtn.className = answerState.isMarked ? 'btn-danger' : 'btn-secondary';
                markBtn.textContent = answerState.isMarked ? '🔖 Unmark' : '🔖 Mark for Review';
                markBtn.addEventListener('click', () => {
                    const newSession = TestEngine.toggleReview(activeSession, questionId);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(index);
                    updatePalette();
                });
                actions.appendChild(markBtn);
            }
            if (activeConfig.allowChangingAnswers || answerState.selected === null) {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'btn-secondary';
                clearBtn.textContent = '🗑️ Clear';
                clearBtn.addEventListener('click', () => {
                    const newSession = TestEngine.clearAnswer(activeSession, questionId);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(index);
                    updatePalette();
                });
                actions.appendChild(clearBtn);
            }
            if (index < activeSession.questionIds.length - 1) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'btn-primary';
                nextBtn.textContent = 'Next ➜';
                nextBtn.addEventListener('click', () => {
                    const newSession = TestEngine.nextQuestion(activeSession);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(newSession.currentQuestionIndex);
                });
                actions.appendChild(nextBtn);
            }
            questionArea.appendChild(actions);
            // Update palette
            updatePalette();
        }
        // Update question palette
        function updatePalette() {
            const paletteGrid = document.getElementById('paletteGrid');
            if (!paletteGrid)
                return;
            paletteGrid.innerHTML = '';
            activeSession.questionIds.forEach((qId, index) => {
                const btn = document.createElement('button');
                btn.style.cssText = `
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        `;
                if (index === activeSession.currentQuestionIndex) {
                    btn.style.borderColor = '#0066cc';
                    btn.style.backgroundColor = '#f0f7ff';
                }
                const answer = activeSession.answers.get(qId);
                const isAnswered = answer && answer.selectedOptionIndex !== null;
                const isMarked = answer?.isMarkedForReview;
                btn.textContent = String(index + 1);
                if (isAnswered && isMarked) {
                    btn.style.backgroundColor = '#cce5ff';
                    btn.style.color = '#004085';
                    btn.title = 'Answered & Marked';
                }
                else if (isMarked) {
                    btn.style.backgroundColor = '#cce5ff';
                    btn.style.color = '#004085';
                    btn.title = 'Marked for review';
                }
                else if (isAnswered) {
                    btn.style.backgroundColor = '#d4edda';
                    btn.style.color = '#155724';
                    btn.title = 'Answered';
                }
                else if (activeSession.visitedQuestions.has(qId)) {
                    btn.style.backgroundColor = '#fff3cd';
                    btn.style.color = '#856404';
                    btn.title = 'Visited';
                }
                btn.addEventListener('click', () => {
                    const newSession = TestEngine.jumpToQuestion(activeSession, index);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(newSession.currentQuestionIndex);
                });
                paletteGrid.appendChild(btn);
            });
        }
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                if (activeSession.currentQuestionIndex > 0) {
                    const newSession = TestEngine.previousQuestion(activeSession);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(newSession.currentQuestionIndex);
                }
            }
            else if (e.key === 'ArrowRight') {
                if (activeSession.currentQuestionIndex < activeSession.questionIds.length - 1) {
                    const newSession = TestEngine.nextQuestion(activeSession);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(newSession.currentQuestionIndex);
                }
            }
            else if (e.key >= '1' && e.key <= '4') {
                const optionIdx = parseInt(e.key) - 1;
                const qId = activeSession.questionIds[activeSession.currentQuestionIndex];
                const q = questionMap.get(qId);
                if (q && optionIdx < q.options.length) {
                    const newSession = TestEngine.selectAnswer(activeSession, qId, optionIdx);
                    Object.assign(activeSession, newSession);
                    storage.saveTestSession(activeSession);
                    displayQuestion(activeSession.currentQuestionIndex);
                }
            }
        });
        // Handle submit
        async function handleSubmitClick() {
            const modal = new Modal('Submit Test', `
          <p>You have answered <strong>${activeSession.answers.size}</strong> out of <strong>${activeSession.questionIds.length}</strong> questions.</p>
          <p>${activeSession.questionIds.length - activeSession.answers.size} questions are unanswered.</p>
          <p>Are you sure you want to submit?</p>
        `);
            const content = modal.getContent();
            const actions = document.createElement('div');
            actions.className = 'btn-group';
            actions.style.marginTop = '1.5rem';
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn-danger';
            confirmBtn.textContent = '📤 Submit Test';
            confirmBtn.addEventListener('click', async () => {
                modal.close();
                await submitTest();
            });
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => modal.close());
            actions.appendChild(confirmBtn);
            actions.appendChild(cancelBtn);
            content.appendChild(actions);
            modal.show();
        }
        async function handleAutoSubmit() {
            showNotification('⏰ Time expired! Submitting test automatically...', 'warning');
            setTimeout(() => submitTest(), 1000);
        }
        async function submitTest() {
            try {
                if (timeoutId)
                    clearInterval(timeoutId);
                if (!currentStudent) {
                    showNotification('Login required to submit the test.', 'error');
                    return;
                }
                activeSession.endTime = Date.now();
                activeSession.isSubmitted = true;
                await storage.saveTestSession(activeSession);
                const result = await TestEngine.submitTest(activeSession, activeConfig, allQuestions);
                result.studentId = currentStudent.id;
                result.studentName = currentStudent.name;
                await storage.saveTestResult(result);
                showNotification('Test submitted successfully!', 'success');
                setTimeout(() => {
                    window.history.pushState({}, '', `/results/${result.id}`);
                    document.dispatchEvent(new Event('app:navigate'));
                }, 1000);
            }
            catch (error) {
                showNotification(`Error submitting test: ${error.message}`, 'error');
            }
        }
        // Mark question as visited
        activeSession.visitedQuestions.add(activeSession.questionIds[activeSession.currentQuestionIndex]);
        // Start
        startTimer();
        displayQuestion(activeSession.currentQuestionIndex);
    }
    catch (error) {
        console.error('Error loading test:', error);
        container.innerHTML = `
      <div class="container" style="padding: 2rem;">
        <div class="alert alert-danger">Error loading test. Please try again.</div>
      </div>
    `;
    }
    return container;
}
