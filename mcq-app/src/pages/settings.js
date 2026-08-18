/**
 * Settings Page
 */
import { storage } from '../storage/storage';
import { createHeader, createEmptyState } from '../components/common';
import { showNotification, downloadJSON } from '../utils/helpers';
export async function createSettingsPage() {
    const container = document.createElement('div');
    container.appendChild(createHeader());
    const main = document.createElement('main');
    main.className = 'main container';
    const title = document.createElement('h1');
    title.textContent = 'Settings';
    title.style.marginBottom = '2rem';
    main.appendChild(title);
    try {
        const savedSettings = await storage.getSettings();
        const defaultSettings = {
            theme: 'light',
            defaultMarks: 1,
            defaultNegativeMarking: 0.25,
            defaultTestDuration: 60,
            autoSave: true,
            confirmBeforeSubmit: true,
            fullscreenMode: false,
        };
        const settings = savedSettings || defaultSettings;
        // Theme Settings
        const themeCard = createSettingsCard('Theme', () => {
            const group = document.createElement('div');
            const label = document.createElement('label');
            label.style.fontWeight = '500';
            label.style.marginBottom = '1rem';
            label.style.display = 'block';
            label.textContent = 'Color Theme';
            const options = document.createElement('div');
            options.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem;';
            const themes = [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System Default' },
            ];
            themes.forEach((theme) => {
                const radio = document.createElement('label');
                radio.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'theme';
                input.value = theme.value;
                input.checked = settings.theme === theme.value;
                input.addEventListener('change', () => {
                    settings.theme = theme.value;
                    applyTheme(theme.value);
                });
                radio.appendChild(input);
                radio.appendChild(document.createTextNode(theme.label));
                options.appendChild(radio);
            });
            group.appendChild(label);
            group.appendChild(options);
            return group;
        });
        main.appendChild(themeCard);
        // Test Defaults
        const defaultsCard = createSettingsCard('Test Defaults', () => {
            const group = document.createElement('div');
            const createInput = (label, key, type = 'number') => {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'form-group';
                const inputLabel = document.createElement('label');
                inputLabel.htmlFor = key;
                inputLabel.textContent = label;
                const input = document.createElement('input');
                input.id = key;
                input.type = type;
                input.value = String(settings[key]);
                input.addEventListener('change', () => {
                    if (type === 'number') {
                        settings[key] = parseFloat(input.value);
                    }
                    else {
                        settings[key] = input.value;
                    }
                });
                inputGroup.appendChild(inputLabel);
                inputGroup.appendChild(input);
                return inputGroup;
            };
            group.appendChild(createInput('Default Marks per Correct', 'defaultMarks'));
            group.appendChild(createInput('Default Negative Marking', 'defaultNegativeMarking'));
            group.appendChild(createInput('Default Test Duration (minutes)', 'defaultTestDuration'));
            return group;
        });
        main.appendChild(defaultsCard);
        // Test Options
        const optionsCard = createSettingsCard('Test Options', () => {
            const group = document.createElement('div');
            const createCheckbox = (label, key) => {
                const checkbox = document.createElement('label');
                checkbox.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = settings[key];
                input.addEventListener('change', () => {
                    settings[key] = input.checked;
                });
                checkbox.appendChild(input);
                checkbox.appendChild(document.createTextNode(label));
                return checkbox;
            };
            group.appendChild(createCheckbox('Enable Auto-save', 'autoSave'));
            group.appendChild(createCheckbox('Confirm Before Submit', 'confirmBeforeSubmit'));
            group.appendChild(createCheckbox('Fullscreen Mode by Default', 'fullscreenMode'));
            return group;
        });
        main.appendChild(optionsCard);
        // Data Management
        const dataCard = createSettingsCard('Data Management', () => {
            const group = document.createElement('div');
            const title = document.createElement('h3');
            title.style.cssText = 'margin-top: 0; margin-bottom: 1rem;';
            title.textContent = 'Backup & Restore';
            const buttons = document.createElement('div');
            buttons.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem;';
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn-primary';
            exportBtn.style.cssText = 'width: 100%;';
            exportBtn.textContent = '💾 Export All Data';
            exportBtn.addEventListener('click', async () => {
                try {
                    const questions = await storage.getAllQuestions();
                    const testConfigs = await storage.getAllTestConfigs();
                    const testResults = await storage.getAllTestResults();
                    const appSettings = await storage.getSettings();
                    const backup = {
                        version: 1,
                        createdAt: Date.now(),
                        questions,
                        testConfigs,
                        testResults,
                        settings: appSettings || defaultSettings,
                    };
                    const filename = `mcq-backup-${new Date().toISOString().split('T')[0]}.json`;
                    downloadJSON(backup, filename);
                    showNotification('Data exported successfully!', 'success');
                }
                catch (error) {
                    showNotification(`Export failed: ${error.message}`, 'error');
                }
            });
            const importBtn = document.createElement('button');
            importBtn.className = 'btn-secondary';
            importBtn.style.cssText = 'width: 100%;';
            importBtn.textContent = '📂 Import Data';
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.addEventListener('change', async (e) => {
                    const file = e.target.files?.[0];
                    if (!file)
                        return;
                    try {
                        const text = await file.text();
                        const backup = JSON.parse(text);
                        if (backup.version !== 1) {
                            throw new Error('Invalid backup version');
                        }
                        if (confirm('This will overwrite your existing data. Continue?')) {
                            await storage.clearAllData();
                            if (backup.questions.length > 0) {
                                await storage.addQuestions(backup.questions);
                            }
                            for (const config of backup.testConfigs) {
                                await storage.saveTestConfig(config);
                            }
                            for (const result of backup.testResults) {
                                await storage.saveTestResult(result);
                            }
                            if (backup.settings) {
                                await storage.saveSettings(backup.settings);
                            }
                            showNotification('Data imported successfully!', 'success');
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    }
                    catch (error) {
                        showNotification(`Import failed: ${error.message}`, 'error');
                    }
                });
                input.click();
            });
            buttons.appendChild(exportBtn);
            buttons.appendChild(importBtn);
            group.appendChild(title);
            group.appendChild(buttons);
            return group;
        });
        main.appendChild(dataCard);
        // Danger Zone
        const dangerCard = createSettingsCard('Danger Zone', () => {
            const group = document.createElement('div');
            const title = document.createElement('h3');
            title.style.cssText = 'margin-top: 0; margin-bottom: 1rem; color: #cc3333;';
            title.textContent = '⚠️ Destructive Actions';
            const buttons = document.createElement('div');
            buttons.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem;';
            const clearQuestionsBtn = document.createElement('button');
            clearQuestionsBtn.className = 'btn-danger';
            clearQuestionsBtn.style.cssText = 'width: 100%;';
            clearQuestionsBtn.textContent = '🗑️ Clear Question Bank';
            clearQuestionsBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete ALL questions? This cannot be undone!')) {
                    await storage.deleteAllQuestions();
                    showNotification('Question bank cleared', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                }
            });
            const clearResultsBtn = document.createElement('button');
            clearResultsBtn.className = 'btn-danger';
            clearResultsBtn.style.cssText = 'width: 100%;';
            clearResultsBtn.textContent = '🗑️ Clear Test History';
            clearResultsBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete ALL test results? This cannot be undone!')) {
                    await storage.deleteAllTestResults();
                    showNotification('Test history cleared', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                }
            });
            const resetBtn = document.createElement('button');
            resetBtn.className = 'btn-danger';
            resetBtn.style.cssText = 'width: 100%;';
            resetBtn.textContent = '⚡ Reset Entire Application';
            resetBtn.addEventListener('click', async () => {
                if (confirm('This will delete EVERYTHING. Are you absolutely sure?')) {
                    if (confirm('Last confirmation - this is irreversible!')) {
                        await storage.clearAllData();
                        localStorage.clear();
                        showNotification('Application reset', 'success');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }
            });
            buttons.appendChild(clearQuestionsBtn);
            buttons.appendChild(clearResultsBtn);
            buttons.appendChild(resetBtn);
            group.appendChild(title);
            group.appendChild(buttons);
            return group;
        });
        main.appendChild(dangerCard);
        // Save button
        const saveSection = document.createElement('div');
        saveSection.style.cssText = 'margin-top: 2rem; display: flex; gap: 1rem;';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-success';
        saveBtn.textContent = '💾 Save Settings';
        saveBtn.addEventListener('click', async () => {
            try {
                await storage.saveSettings(settings);
                showNotification('Settings saved successfully!', 'success');
            }
            catch (error) {
                showNotification(`Error saving settings: ${error.message}`, 'error');
            }
        });
        const cancelBtn = document.createElement('a');
        cancelBtn.href = '/dashboard';
        cancelBtn.setAttribute('data-link', '');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = 'Cancel';
        saveSection.appendChild(saveBtn);
        saveSection.appendChild(cancelBtn);
        main.appendChild(saveSection);
    }
    catch (error) {
        console.error('Error loading settings:', error);
        main.appendChild(createEmptyState('❌', 'Error', 'Failed to load settings. Please refresh the page.'));
    }
    container.appendChild(main);
    return container;
}
function createSettingsCard(title, contentFn) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '1.5rem';
    const cardTitle = document.createElement('h2');
    cardTitle.style.cssText = 'margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem;';
    cardTitle.textContent = title;
    card.appendChild(cardTitle);
    card.appendChild(contentFn());
    return card;
}
function applyTheme(theme) {
    const body = document.body;
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    else {
        body.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
}
