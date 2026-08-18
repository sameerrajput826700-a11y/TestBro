/**
 * Simple lightweight client-side router
 */
export class Router {
    constructor(appElement) {
        Object.defineProperty(this, "routes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "currentPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ''
        });
        Object.defineProperty(this, "appElement", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.appElement = appElement;
        this.setupNavigationListener();
    }
    register(path, handler) {
        this.routes.set(path, handler);
    }
    setupNavigationListener() {
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-link]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    this.navigate(href);
                }
            }
        });
    }
    navigate(path) {
        if (this.currentPath !== path) {
            this.currentPath = path;
            window.history.pushState({}, '', path);
            this.handleRoute();
        }
    }
    async handleRoute() {
        const path = this.getCurrentPath();
        this.currentPath = path;
        const handler = this.findMatchingHandler(path);
        if (handler && this.appElement) {
            try {
                this.appElement.innerHTML = '';
                const element = await handler();
                this.appElement.appendChild(element);
            }
            catch (error) {
                console.error('Error rendering route:', error);
                this.showError('Failed to load page');
            }
        }
        else {
            this.showNotFound();
        }
    }
    findMatchingHandler(path) {
        // Exact match
        if (this.routes.has(path)) {
            return this.routes.get(path);
        }
        // Dynamic routes - /test/:id format
        for (const [routePath, handler] of this.routes) {
            const pattern = this.pathToPattern(routePath);
            if (pattern.test(path)) {
                return handler;
            }
        }
        return null;
    }
    pathToPattern(path) {
        const escaped = path.replace(/\//g, '\\/');
        const pattern = escaped.replace(/:[^/]+/g, '[^/]+');
        return new RegExp(`^${pattern}$`);
    }
    getCurrentPath() {
        return window.location.pathname || '/dashboard';
    }
    showNotFound() {
        if (this.appElement) {
            this.appElement.innerHTML = `
        <div class="container" style="padding: 2rem; text-align: center;">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/dashboard" class="btn-primary" data-link>Go to Dashboard</a>
        </div>
      `;
        }
    }
    showError(message) {
        if (this.appElement) {
            this.appElement.innerHTML = `
        <div class="container" style="padding: 2rem;">
          <div class="alert alert-danger">${message}</div>
          <a href="/dashboard" class="btn-primary" data-link>Go to Dashboard</a>
        </div>
      `;
        }
    }
}
