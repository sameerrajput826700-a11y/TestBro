/**
 * Import Questions Page
 */
import { storage } from '../storage/storage';
import { QuestionImporter } from '../engine/importer';
import { readFileAsText, showNotification } from '../utils/helpers';
import { createHeader, Modal } from '../components/common';
export async function createImportPage() {
    const container = document.createElement('div');
    container.appendChild(createHeader());
    const main = document.createElement('main');
    main.className = 'main container';
    const title = document.createElement('h1');
    title.textContent = 'Import Questions';
    title.style.marginBottom = '2rem';
    main.appendChild(title);
    // Upload area
    const uploadCard = document.createElement('div');
    uploadCard.className = 'card';
    const offlineModules = Object.entries(import.meta.glob('../../offline-question-bank/*.json', { eager: true, import: 'default' }));
    const importAllOfflineModules = async () => {
        const allQuestions = [];
        for (const [, moduleData] of offlineModules) {
            const parsed = typeof moduleData === 'string' ? JSON.parse(moduleData) : moduleData;
            const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
            allQuestions.push(...questions);
        }
        if (allQuestions.length === 0) {
            showNotification('No offline questions available to import.', 'warning');
            return;
        }
        const validation = QuestionImporter.validateImport(JSON.stringify(allQuestions));
        showValidationResults(validation.valid, validation.invalid, validation.duplicateIds);
    };
    const offlineCard = document.createElement('div');
    offlineCard.className = 'card';
    offlineCard.style.marginTop = '2rem';
    const offlineTitle = document.createElement('h2');
    offlineTitle.textContent = 'Offline Question Bank';
    offlineTitle.style.fontSize = '1.1rem';
    offlineTitle.style.marginBottom = '1rem';
    offlineCard.appendChild(offlineTitle);
    const offlineActions = document.createElement('div');
    offlineActions.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.75rem;';
    const importAllBtn = document.createElement('button');
    importAllBtn.className = 'btn-success';
    importAllBtn.textContent = 'Import All Offline Modules';
    importAllBtn.addEventListener('click', () => {
        importAllOfflineModules();
    });
    offlineActions.appendChild(importAllBtn);
    if (offlineModules.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-muted';
        empty.textContent = 'No offline module files found in offline-question-bank/';
        offlineActions.appendChild(empty);
    }
    else {
        offlineModules.forEach(([modulePath, moduleData]) => {
            const moduleName = modulePath.split('/').pop()?.replace(/\.json$/i, '') || 'Module';
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            btn.textContent = `Load ${moduleName}`;
            btn.addEventListener('click', () => {
                const parsed = typeof moduleData === 'string' ? JSON.parse(moduleData) : moduleData;
                const validation = QuestionImporter.validateImport(JSON.stringify(parsed));
                showValidationResults(validation.valid, validation.invalid, validation.duplicateIds);
            });
            offlineActions.appendChild(btn);
        });
    }
    offlineCard.appendChild(offlineActions);
    main.appendChild(offlineCard);
    const uploadArea = document.createElement('div');
    uploadArea.id = 'uploadArea';
    uploadArea.style.cssText = `
    border: 2px dashed #0066cc;
    border-radius: 8px;
    padding: 3rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #f0f7ff;
  `;
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#0052a3';
        uploadArea.style.backgroundColor = '#e3f2fd';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#0066cc';
        uploadArea.style.backgroundColor = '#f0f7ff';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#0066cc';
        uploadArea.style.backgroundColor = '#f0f7ff';
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    uploadArea.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: 1rem;">📁</div>
    <h3>Drag and drop your JSON file here</h3>
    <p class="text-muted">or click to browse</p>
  `;
    uploadArea.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileUpload(files[0]);
            }
        });
        input.click();
    });
    uploadCard.appendChild(uploadArea);
    main.appendChild(uploadCard);
    // Format info
    const infoCard = document.createElement('div');
    infoCard.className = 'card';
    infoCard.style.marginTop = '2rem';
    const infoTitle = document.createElement('h2');
    infoTitle.textContent = 'Supported Formats';
    infoTitle.style.fontSize = '1.1rem';
    infoTitle.style.marginBottom = '1rem';
    infoCard.appendChild(infoTitle);
    const formatInfo = document.createElement('div');
    formatInfo.innerHTML = `
    <p><strong>Array Format:</strong></p>
    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto;"><code>[
  {
    "id": "q001",
    "question": "What is 2+2?",
    "options": ["3", "4", "5", "6"],
    "answer": 1,
    "explanation": "2+2=4",
    "subject": "Math",
    "difficulty": "easy",
    "marks": 1
  }
]</code></pre>

    <p style="margin-top: 1rem;"><strong>Wrapped Format:</strong></p>
    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto;"><code>{
  "title": "General Knowledge",
  "questions": [
    { ... }
  ]
}</code></pre>

    <p style="margin-top: 1rem;"><strong>Required Fields:</strong> question, options (min 2), answer</p>
    <p><strong>Optional Fields:</strong> id, explanation, subject, topic, difficulty, marks, negativeMarks, tags</p>
  `;
    infoCard.appendChild(formatInfo);
    main.appendChild(infoCard);
    async function handleFileUpload(file) {
        if (!file.name.endsWith('.json')) {
            showNotification('Please select a valid JSON file', 'error');
            return;
        }
        try {
            const content = await readFileAsText(file);
            const validation = QuestionImporter.validateImport(content);
            showValidationResults(validation.valid, validation.invalid, validation.duplicateIds);
        }
        catch (error) {
            showNotification(`Error reading file: ${error.message}`, 'error');
        }
    }
    function showValidationResults(validQuestions, invalidQuestions, duplicateIds) {
        const modal = new Modal('Import Validation Results', document.createElement('div'));
        const content = modal.getContent();
        const statsDiv = document.createElement('div');
        statsDiv.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    `;
        const validStat = document.createElement('div');
        validStat.className = 'card';
        validStat.style.cssText = 'text-align: center; padding: 1rem;';
        validStat.innerHTML = `
      <div style="font-size: 1.5rem; color: #26a626;">✓</div>
      <div>${validQuestions.length} Valid</div>
    `;
        const invalidStat = document.createElement('div');
        invalidStat.className = 'card';
        invalidStat.style.cssText = 'text-align: center; padding: 1rem;';
        invalidStat.innerHTML = `
      <div style="font-size: 1.5rem; color: #cc3333;">✗</div>
      <div>${invalidQuestions.length} Invalid</div>
    `;
        const duplicateStat = document.createElement('div');
        duplicateStat.className = 'card';
        duplicateStat.style.cssText = 'text-align: center; padding: 1rem;';
        duplicateStat.innerHTML = `
      <div style="font-size: 1.5rem; color: #cc9900;">⚠</div>
      <div>${duplicateIds.length} Duplicates</div>
    `;
        statsDiv.appendChild(validStat);
        statsDiv.appendChild(invalidStat);
        statsDiv.appendChild(duplicateStat);
        content.appendChild(statsDiv);
        if (invalidQuestions.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning';
            errorDiv.style.marginBottom = '1rem';
            const errorTitle = document.createElement('strong');
            errorTitle.textContent = `${invalidQuestions.length} Questions have errors:`;
            errorDiv.appendChild(errorTitle);
            const errorList = document.createElement('ul');
            errorList.style.marginTop = '0.5rem';
            invalidQuestions.slice(0, 5).forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item.error;
                errorList.appendChild(li);
            });
            if (invalidQuestions.length > 5) {
                const li = document.createElement('li');
                li.style.fontWeight = 'bold';
                li.textContent = `... and ${invalidQuestions.length - 5} more`;
                errorList.appendChild(li);
            }
            errorDiv.appendChild(errorList);
            content.appendChild(errorDiv);
        }
        if (validQuestions.length > 0) {
            const actions = document.createElement('div');
            actions.className = 'btn-group';
            actions.style.marginTop = '1.5rem';
            const importBtn = document.createElement('button');
            importBtn.className = 'btn-success';
            importBtn.textContent = `Import ${validQuestions.length} Questions`;
            importBtn.addEventListener('click', async () => {
                try {
                    await storage.addQuestions(validQuestions);
                    showNotification(`Successfully imported ${validQuestions.length} questions`, 'success');
                    modal.close();
                    // Redirect to question bank
                    setTimeout(() => {
                        window.history.pushState({}, '', '/questions');
                        document.dispatchEvent(new Event('app:navigate'));
                    }, 1000);
                }
                catch (error) {
                    showNotification(`Error importing questions: ${error.message}`, 'error');
                }
            });
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => modal.close());
            actions.appendChild(importBtn);
            actions.appendChild(cancelBtn);
            content.appendChild(actions);
        }
        modal.show();
    }
    container.appendChild(main);
    return container;
}
