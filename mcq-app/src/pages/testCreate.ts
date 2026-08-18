/**
 * Test Creation Page
 */

import { storage } from '../storage/storage';
import { TestEngine } from '../engine/testEngine';
import { createHeader, createEmptyState, createLoadingSpinner } from '../components/common';
import { showNotification, generateId } from '../utils/helpers';
import { getCurrentStudent } from '../utils/studentAuth';
import type { TestConfiguration, TestSession } from '../models/types';

export async function createNewTestPage(): Promise<HTMLElement> {
  const container = document.createElement('div');
  container.appendChild(createHeader());

  const main = document.createElement('main');
  main.className = 'main container';

  const currentStudent = getCurrentStudent();
  if (!currentStudent) {
    const notFound = document.createElement('div');
    notFound.className = 'container';
    notFound.innerHTML = '<div class="alert alert-danger">Login required to begin a test.</div><a href="/login" class="btn-primary" data-link>Go to Login</a>';
    container.appendChild(notFound);
    return container;
  }

  main.appendChild(createLoadingSpinner());

  try {
    const questions = await storage.getAllQuestions();

    main.innerHTML = '';

    const title = document.createElement('h1');
    title.textContent = 'Create Test';
    title.style.marginBottom = '2rem';
    main.appendChild(title);

    if (questions.length === 0) {
      main.appendChild(
        createEmptyState(
          '📚',
          'No Questions Available',
          'Import questions first before creating a test.'
        )
      );
      const backBtn = document.createElement('a');
      backBtn.href = '/questions/import';
      backBtn.setAttribute('data-link', '');
      backBtn.className = 'btn-primary';
      backBtn.style.marginTop = '1rem';
      backBtn.textContent = '📥 Import Questions';
      main.appendChild(backBtn);
    } else {
      const form = document.createElement('form');
      form.style.maxWidth = '600px';

      // Test Name
      const nameGroup = createFormGroup('Test Name', 'text', 'testName', 'General Knowledge Mock Test', true);
      form.appendChild(nameGroup);

      // Test Description
      const descGroup = createFormGroup(
        'Test Description',
        'textarea',
        'testDescription',
        'Test your knowledge'
      );
      form.appendChild(descGroup);

      // Question Selection Mode
      const selectionSection = document.createElement('div');
      selectionSection.className = 'card';
      selectionSection.style.marginBottom = '1.5rem';

      const selectionTitle = document.createElement('h3');
      selectionTitle.textContent = 'Question Selection';
      selectionTitle.style.marginBottom = '1rem';
      selectionSection.appendChild(selectionTitle);

      const selectionModes = [
        { value: 'random', label: 'Random Questions', description: 'Random from all questions' },
        { value: 'all', label: 'All Questions', description: 'Include all questions' },
        { value: 'filtered', label: 'Filtered Questions', description: 'Based on subject/topic' },
      ];

      const modeOptions = document.createElement('div');
      modeOptions.style.cssText = 'display: flex; flex-direction: column; gap: 1rem;';

      let selectedMode = 'random';

      selectionModes.forEach((mode) => {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer;';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'selectionMode';
        radio.value = mode.value;
        radio.checked = mode.value === 'random';
        radio.addEventListener('change', () => {
          selectedMode = mode.value;
          updateFilters();
        });

        const text = document.createElement('div');
        text.innerHTML = `<strong>${mode.label}</strong><br><small class="text-muted">${mode.description}</small>`;

        label.appendChild(radio);
        label.appendChild(text);
        modeOptions.appendChild(label);
      });

      selectionSection.appendChild(modeOptions);

      // Filters
      const filterDiv = document.createElement('div');
      filterDiv.id = 'filterOptions';
      filterDiv.style.cssText = 'margin-top: 1rem; display: none;';

      const subjects = new Set(questions.map((q) => q.subject).filter((s): s is string => Boolean(s)));
      const topics = new Set(questions.map((q) => q.topic).filter((t): t is string => Boolean(t)));
      const difficulties = new Set(
        questions
          .map((q) => q.difficulty)
          .filter((d): d is 'easy' | 'medium' | 'hard' => d !== undefined)
      );

      const createCheckboxGroup = (label: string, items: Set<string>, name: string) => {
        const group = document.createElement('div');
        group.style.marginBottom = '1rem';

        const groupLabel = document.createElement('label');
        groupLabel.style.fontWeight = '500';
        groupLabel.style.marginBottom = '0.5rem';
        groupLabel.style.display = 'block';
        groupLabel.textContent = label;
        group.appendChild(groupLabel);

        const checkboxes = document.createElement('div');
        checkboxes.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;';

        Array.from(items).forEach((item) => {
          const checkbox = document.createElement('label');
          checkbox.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.name = name;
          input.value = item;

          checkbox.appendChild(input);
          checkbox.appendChild(document.createTextNode(item));
          checkboxes.appendChild(checkbox);
        });

        group.appendChild(checkboxes);
        return group;
      };

      if (subjects.size > 0) filterDiv.appendChild(createCheckboxGroup('Subjects', subjects, 'subjects'));
      if (topics.size > 0) filterDiv.appendChild(createCheckboxGroup('Topics', topics, 'topics'));
      if (difficulties.size > 0) filterDiv.appendChild(createCheckboxGroup('Difficulty', difficulties, 'difficulties'));

      selectionSection.appendChild(filterDiv);
      form.appendChild(selectionSection);

      function updateFilters() {
        if (selectedMode === 'filtered') {
          filterDiv.style.display = 'block';
        } else {
          filterDiv.style.display = 'none';
        }
      }

      // Number of Questions
      const numQGroup = createFormGroup(
        'Number of Questions',
        'number',
        'numberOfQuestions',
        Math.min(100, questions.length).toString(),
        true,
        {
          min: '1',
          max: questions.length.toString(),
        }
      );
      form.appendChild(numQGroup);

      // Time Limit
      const timeGroup = createFormGroup('Time Limit (minutes)', 'number', 'timeLimit', '60', true, {
        min: '1',
      });
      form.appendChild(timeGroup);

      // Marks Configuration
      const marksSection = document.createElement('div');
      marksSection.className = 'card';
      marksSection.style.marginBottom = '1.5rem';

      const marksTitle = document.createElement('h3');
      marksTitle.textContent = 'Marks Configuration';
      marksTitle.style.marginBottom = '1rem';
      marksSection.appendChild(marksTitle);

      const correctGroup = createFormGroup(
        'Marks for Correct Answer',
        'number',
        'marksPerCorrect',
        '4',
        true,
        { step: '0.25' }
      );
      marksSection.appendChild(correctGroup);

      const negativeGroup = createFormGroup(
        'Negative Marks for Wrong Answer',
        'number',
        'negativeMarking',
        '1',
        true,
        { step: '0.25' }
      );
      marksSection.appendChild(negativeGroup);

      const passGroup = createFormGroup('Pass Percentage (%)', 'number', 'passPercentage', '50', true, {
        min: '0',
        max: '100',
      });
      marksSection.appendChild(passGroup);

      form.appendChild(marksSection);

      // Options
      const optionsSection = document.createElement('div');
      optionsSection.className = 'card';
      optionsSection.style.marginBottom = '1.5rem';

      const optionsTitle = document.createElement('h3');
      optionsTitle.textContent = 'Test Options';
      optionsTitle.style.marginBottom = '1rem';
      optionsSection.appendChild(optionsTitle);

      const options = [
        { id: 'shuffleQuestions', label: 'Shuffle Questions' },
        { id: 'shuffleOptions', label: 'Shuffle Options' },
        { id: 'allowNavigation', label: 'Allow Navigation Between Questions' },
        { id: 'allowChangingAnswers', label: 'Allow Changing Answers' },
        { id: 'allowMarkForReview', label: 'Allow Mark for Review' },
        { id: 'autoSubmitOnTimeExpire', label: 'Auto-submit When Time Expires' },
      ];

      options.forEach((opt) => {
        const group = createFormGroup(opt.label, 'checkbox', opt.id, 'true', false);
        optionsSection.appendChild(group);
      });

      form.appendChild(optionsSection);

      // Buttons
      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'btn-group';

      const saveBtn = document.createElement('button');
      saveBtn.type = 'submit';
      saveBtn.name = 'action';
      saveBtn.value = 'save';
      saveBtn.className = 'btn-primary';
      saveBtn.textContent = 'Save Test';

      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.name = 'action';
      submitBtn.value = 'start';
      submitBtn.className = 'btn-success';
      submitBtn.textContent = '🚀 Create & Start Test';

      const cancelBtn = document.createElement('a');
      cancelBtn.href = '/tests';
      cancelBtn.setAttribute('data-link', '');
      cancelBtn.className = 'btn-secondary';
      cancelBtn.textContent = 'Cancel';

      buttonGroup.appendChild(saveBtn);
      buttonGroup.appendChild(submitBtn);
      buttonGroup.appendChild(cancelBtn);

      form.appendChild(buttonGroup);

      // Form submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const action = (e.submitter as HTMLButtonElement | null)?.value || 'start';

        const config: TestConfiguration = {
          id: generateId('test'),
          name: formData.get('testName') as string,
          description: formData.get('testDescription') as string,
          numberOfQuestions: parseInt(formData.get('numberOfQuestions') as string),
          timeLimit: parseInt(formData.get('timeLimit') as string),
          marksPerCorrect: parseFloat(formData.get('marksPerCorrect') as string),
          negativeMarking: parseFloat(formData.get('negativeMarking') as string),
          passPercentage: parseFloat(formData.get('passPercentage') as string),
          shuffleQuestions: formData.get('shuffleQuestions') === 'true',
          shuffleOptions: formData.get('shuffleOptions') === 'true',
          showQuestionNumbers: true,
          allowNavigation: formData.get('allowNavigation') === 'true',
          allowChangingAnswers: formData.get('allowChangingAnswers') === 'true',
          allowMarkForReview: formData.get('allowMarkForReview') === 'true',
          autoSubmitOnTimeExpire: formData.get('autoSubmitOnTimeExpire') === 'true',
          fullscreenMode: false,
          randomSelection: selectedMode === 'random',
          selectionMode: selectedMode as 'random' | 'all' | 'filtered' | 'selected',
          createdAt: Date.now(),
        };

        if (selectedMode === 'filtered') {
          const subjects = formData.getAll('subjects') as string[];
          const topics = formData.getAll('topics') as string[];
          const difficulties = formData.getAll('difficulties') as string[];

          config.filters = {
            subjects: subjects.length > 0 ? subjects : undefined,
            topics: topics.length > 0 ? topics : undefined,
            difficulties: difficulties.length > 0 ? difficulties : undefined,
          };
        }

        try {
          // Save config
          await storage.saveTestConfig(config);

          if (action === 'save') {
            showNotification('Test saved successfully!', 'success');
            setTimeout(() => {
              window.history.pushState({}, '', '/tests');
              document.dispatchEvent(new Event('app:navigate'));
            }, 500);
            return;
          }

          // Create session
          const sessionData = await TestEngine.createTestSession(config, questions);
          const session: TestSession = {
            ...sessionData,
            studentId: currentStudent.id,
          };
          await storage.saveTestSession(session);

          showNotification('Test created successfully!', 'success');

          // Navigate to test screen
          setTimeout(() => {
            window.history.pushState({}, '', `/test/${session.id}`);
            document.dispatchEvent(new Event('app:navigate'));
          }, 500);
        } catch (error: any) {
          showNotification(`Error creating test: ${error.message}`, 'error');
        }
      });

      main.appendChild(form);
    }
  } catch (error) {
    console.error('Error creating test page:', error);
    main.innerHTML = '';
    main.appendChild(
      createEmptyState('❌', 'Error', 'Failed to create test. Please refresh the page.')
    );
  }

  container.appendChild(main);
  return container;
}

function createFormGroup(
  label: string,
  type: string,
  name: string,
  defaultValue: string = '',
  required: boolean = false,
  attributes: Record<string, string> = {}
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = name;
  labelEl.innerHTML = required ? `${label} <span style="color: red;">*</span>` : label;

  const input =
    type === 'textarea' ? document.createElement('textarea') : document.createElement('input');

  if (type !== 'textarea') {
    (input as HTMLInputElement).type = type;
  }

  input.id = name;
  input.name = name;
  input.value = defaultValue;

  if (required && type !== 'checkbox') {
    input.required = true;
  }

  if (type === 'checkbox') {
    input.value = 'true';
    group.className = 'form-group inline';
    if (defaultValue === 'true') {
      (input as HTMLInputElement).checked = true;
    }
  }

  Object.entries(attributes).forEach(([key, value]) => {
    input.setAttribute(key, value);
  });

  group.appendChild(labelEl);
  group.appendChild(input);

  return group;
}
