/**
 * Student Login Page
 */

import { createHeader } from '../components/common';
import { setCurrentStudent, validateStudentLogin } from '../utils/studentAuth';
import { showNotification } from '../utils/helpers';

export function createStudentLoginPage(): HTMLElement {
  const container = document.createElement('div');
  container.appendChild(createHeader());

  const main = document.createElement('main');
  main.className = 'main container';
  main.style.minHeight = '70vh';
  main.style.display = 'flex';
  main.style.alignItems = 'center';
  main.style.justifyContent = 'center';

  const card = document.createElement('div');
  card.className = 'card';
  card.style.maxWidth = '420px';
  card.style.width = '100%';
  card.style.padding = '2rem';

  const title = document.createElement('h1');
  title.textContent = 'Student Login';
  title.style.marginBottom = '1.5rem';
  title.style.textAlign = 'center';
  card.appendChild(title);

  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '1rem';

  const studentIdGroup = document.createElement('div');
  studentIdGroup.className = 'form-group';
  const studentIdLabel = document.createElement('label');
  studentIdLabel.textContent = 'Student ID';
  studentIdLabel.htmlFor = 'studentId';
  const studentIdInput = document.createElement('input');
  studentIdInput.id = 'studentId';
  studentIdInput.name = 'studentId';
  studentIdInput.type = 'text';
  studentIdInput.placeholder = 'e.g. STU001';
  studentIdInput.required = true;
  studentIdGroup.appendChild(studentIdLabel);
  studentIdGroup.appendChild(studentIdInput);

  const passwordGroup = document.createElement('div');
  passwordGroup.className = 'form-group';
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Password';
  passwordLabel.htmlFor = 'password';
  const passwordInput = document.createElement('input');
  passwordInput.id = 'password';
  passwordInput.name = 'password';
  passwordInput.type = 'password';
  passwordInput.placeholder = 'Enter password';
  passwordInput.required = true;
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInput);

  const loginButton = document.createElement('button');
  loginButton.type = 'submit';
  loginButton.className = 'btn-primary';
  loginButton.textContent = 'Login';

  const demoInfo = document.createElement('div');
  demoInfo.className = 'text-muted';
  demoInfo.style.fontSize = '0.85rem';
  demoInfo.style.marginTop = '0.5rem';
  demoInfo.innerHTML = '<strong>Demo IDs:</strong> SHWETA, STU002, STU003<br><strong>Password:</strong> 1234';

  form.appendChild(studentIdGroup);
  form.appendChild(passwordGroup);
  form.appendChild(loginButton);
  form.appendChild(demoInfo);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const studentId = (document.getElementById('studentId') as HTMLInputElement)?.value || '';
    const password = (document.getElementById('password') as HTMLInputElement)?.value || '';

    const student = validateStudentLogin(studentId, password);
    if (!student) {
      showNotification('Invalid student ID or password.', 'error');
      return;
    }

    setCurrentStudent(student);
    showNotification(`Welcome ${student.name}!`, 'success');

    setTimeout(() => {
      window.history.pushState({}, '', '/dashboard');
      document.dispatchEvent(new Event('app:navigate'));
    }, 300);
  });

  card.appendChild(form);
  main.appendChild(card);
  container.appendChild(main);
  return container;
}
