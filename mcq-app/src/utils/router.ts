/**
 * Simple lightweight client-side router
 */

export type RouteHandler = () => Promise<HTMLElement> | HTMLElement;

export interface Route {
  path: string;
  handler: RouteHandler;
}

export class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private currentPath: string = '';
  private appElement: HTMLElement | null = null;

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
    this.setupNavigationListener();
  }

  register(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  private setupNavigationListener(): void {
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    document.addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest('a[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          this.navigate(href);
        }
      }
    });
  }

  navigate(path: string): void {
    if (this.currentPath !== path) {
      this.currentPath = path;
      window.history.pushState({}, '', path);
      this.handleRoute();
    }
  }

  private async handleRoute(): Promise<void> {
    const path = this.getCurrentPath();
    this.currentPath = path;

    const handler = this.findMatchingHandler(path);

    if (handler && this.appElement) {
      try {
        this.appElement.innerHTML = '';
        const element = await handler();
        this.appElement.appendChild(element);
      } catch (error) {
        console.error('Error rendering route:', error);
        this.showError('Failed to load page');
      }
    } else {
      this.showNotFound();
    }
  }

  private findMatchingHandler(path: string): RouteHandler | null {
    // Exact match
    if (this.routes.has(path)) {
      return this.routes.get(path)!;
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

  private pathToPattern(path: string): RegExp {
    const escaped = path.replace(/\//g, '\\/');
    const pattern = escaped.replace(/:[^/]+/g, '[^/]+');
    return new RegExp(`^${pattern}$`);
  }

  private getCurrentPath(): string {
    return window.location.pathname || '/dashboard';
  }

  private showNotFound(): void {
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

  private showError(message: string): void {
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
