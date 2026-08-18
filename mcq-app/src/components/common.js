/**
 * Header/Navigation Component
 */
export function createHeader() {
    const header = document.createElement('header');
    header.className = 'header';
    const container = document.createElement('div');
    container.className = 'container flex justify-between align-center';
    const title = document.createElement('h1');
    title.style.margin = '0';
    title.style.fontSize = '1.5rem';
    title.textContent = 'TestBro.in';
    const nav = document.createElement('nav');
    nav.style.display = 'flex';
    nav.style.gap = '1.5rem';
    nav.style.alignItems = 'center';
    const links = [
        { href: '/dashboard', text: 'Dashboard' },
        { href: '/questions', text: 'Questions' },
        { href: '/tests', text: 'Tests' },
        { href: '/history', text: 'History' },
        { href: '/settings', text: 'Settings' },
    ];
    links.forEach(({ href, text }) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        link.className = 'nav-link';
        link.setAttribute('data-link', '');
        link.style.cssText = 'font-weight: 500; transition: color 0.2s;';
        link.addEventListener('mouseenter', () => {
            link.style.color = '#0066cc';
        });
        link.addEventListener('mouseleave', () => {
            link.style.color = '';
        });
        nav.appendChild(link);
    });
    const logoutLink = document.createElement('a');
    logoutLink.href = '/logout';
    logoutLink.textContent = 'Logout';
    logoutLink.setAttribute('data-link', '');
    logoutLink.style.cssText = 'font-weight: 600; color: #cc3333;';
    nav.appendChild(logoutLink);
    container.appendChild(title);
    container.appendChild(nav);
    header.appendChild(container);
    return header;
}
/**
 * Dashboard Stats Card
 */
export function createStatsCard(label, value, icon) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = `
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
  `;
    if (icon) {
        const iconEl = document.createElement('div');
        iconEl.style.cssText = `
      font-size: 2rem;
      opacity: 0.7;
    `;
        iconEl.textContent = icon;
        card.appendChild(iconEl);
    }
    const content = document.createElement('div');
    const labelEl = document.createElement('div');
    labelEl.className = 'text-muted';
    labelEl.style.fontSize = '0.9rem';
    labelEl.textContent = label;
    const valueEl = document.createElement('div');
    valueEl.style.cssText = `
    font-size: 1.5rem;
    font-weight: 600;
  `;
    valueEl.textContent = String(value);
    content.appendChild(labelEl);
    content.appendChild(valueEl);
    card.appendChild(content);
    return card;
}
/**
 * Progress Bar
 */
export function createProgressBar(current, total, label) {
    const container = document.createElement('div');
    container.style.cssText = 'width: 100%;';
    if (label) {
        const labelEl = document.createElement('div');
        labelEl.style.cssText = 'margin-bottom: 0.5rem; font-weight: 500;';
        labelEl.textContent = label;
        container.appendChild(labelEl);
    }
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
    width: 100%;
    height: 24px;
    background-color: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  `;
    const percentage = (current / Math.max(total, 1)) * 100;
    const bar = document.createElement('div');
    bar.style.cssText = `
    height: 100%;
    width: ${percentage}%;
    background-color: #0066cc;
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8rem;
    font-weight: 500;
  `;
    bar.textContent = `${Math.round(percentage)}%`;
    barContainer.appendChild(bar);
    container.appendChild(barContainer);
    return container;
}
/**
 * Question State Indicator
 */
export function createQuestionStateIndicator(state) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.75rem;
  `;
    switch (state) {
        case 'not-visited':
            indicator.style.cssText += 'background-color: #e0e0e0; color: #666;';
            indicator.textContent = '○';
            indicator.title = 'Not visited';
            break;
        case 'visited':
            indicator.style.cssText += 'background-color: #fff3cd; color: #666;';
            indicator.textContent = '◐';
            indicator.title = 'Visited';
            break;
        case 'answered':
            indicator.style.cssText += 'background-color: #d4edda; color: #155724;';
            indicator.textContent = '✓';
            indicator.title = 'Answered';
            break;
        case 'marked':
            indicator.style.cssText += 'background-color: #cce5ff; color: #004085;';
            indicator.textContent = '⊙';
            indicator.title = 'Marked for review';
            break;
    }
    return indicator;
}
/**
 * Modal Dialog
 */
export class Modal {
    constructor(title, content) {
        Object.defineProperty(this, "modal", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "backdrop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.backdrop = document.createElement('div');
        this.backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
        this.modal = document.createElement('div');
        this.modal.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 1000;
      min-width: 300px;
    `;
        const body = document.querySelector('body');
        if (body && body.hasAttribute('data-theme') && body.getAttribute('data-theme') === 'dark') {
            this.modal.style.backgroundColor = '#2a2a2a';
            this.modal.style.color = '#e0e0e0';
        }
        const header = document.createElement('div');
        header.style.cssText = `
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
        const titleEl = document.createElement('h2');
        titleEl.style.margin = '0';
        titleEl.textContent = title;
        header.appendChild(titleEl);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
        const headerBody = document.createElement('div');
        headerBody.style.padding = '1.5rem';
        if (typeof content === 'string') {
            headerBody.innerHTML = content;
        }
        else {
            headerBody.appendChild(content);
        }
        this.modal.appendChild(header);
        this.modal.appendChild(headerBody);
        this.backdrop.appendChild(this.modal);
    }
    show() {
        document.body.appendChild(this.backdrop);
    }
    close() {
        if (this.backdrop.parentElement) {
            this.backdrop.parentElement.removeChild(this.backdrop);
        }
    }
    getContent() {
        return this.modal.querySelector('div:last-child');
    }
}
/**
 * Loading Spinner
 */
export function createLoadingSpinner() {
    const container = document.createElement('div');
    container.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  `;
    const spinner = document.createElement('div');
    spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0066cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  `;
    const style = document.createElement('style');
    style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(style);
    container.appendChild(spinner);
    return container;
}
/**
 * Empty State
 */
export function createEmptyState(icon, title, description) {
    const container = document.createElement('div');
    container.style.cssText = `
    text-align: center;
    padding: 3rem 1rem;
  `;
    const iconEl = document.createElement('div');
    iconEl.style.cssText = `
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  `;
    iconEl.textContent = icon;
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.marginBottom = '0.5rem';
    const descEl = document.createElement('p');
    descEl.className = 'text-muted';
    descEl.textContent = description;
    container.appendChild(iconEl);
    container.appendChild(titleEl);
    container.appendChild(descEl);
    return container;
}
