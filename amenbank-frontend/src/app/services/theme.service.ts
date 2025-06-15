import { Injectable, Renderer2, RendererFactory2, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type ThemeType = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private readonly THEME_KEY = 'user-theme-preference';
  
  private isDarkTheme = new BehaviorSubject<boolean>(false);
  private currentTheme = new BehaviorSubject<ThemeType>('auto');
  
  // Public observables
  isDarkTheme$ = this.isDarkTheme.asObservable();
  currentTheme$ = this.currentTheme.asObservable();

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.setupSystemThemeListener();
    }
  }

  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    const systemPrefersDark = this.getSystemThemePreference();
    
    // Determine initial theme
    let initialTheme: ThemeType = 'auto';
    let isDark = systemPrefersDark;
    
    if (savedTheme) {
      initialTheme = savedTheme;
      if (savedTheme === 'dark') {
        isDark = true;
      } else if (savedTheme === 'light') {
        isDark = false;
      }
      // If 'auto', use system preference
    }
    
    // Apply theme immediately to prevent flash
    this.applyTheme(isDark);
    
    // Update subjects
    this.currentTheme.next(initialTheme);
    this.isDarkTheme.next(isDark);
  }

  private getSavedTheme(): ThemeType | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      return saved as ThemeType || null;
    } catch {
      return null;
    }
  }

  private getSystemThemePreference(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private setupSystemThemeListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Only respond to system changes if theme is set to 'auto'
      if (this.currentTheme.value === 'auto') {
        this.applyTheme(e.matches);
        this.isDarkTheme.next(e.matches);
      }
    });
  }

  private applyTheme(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const body = document.body;
    
    if (isDark) {
      this.renderer.removeClass(body, 'light-theme');
      this.renderer.addClass(body, 'dark-theme');
      this.updateMetaThemeColor('#0f172a');
    } else {
      this.renderer.removeClass(body, 'dark-theme');
      this.renderer.addClass(body, 'light-theme');
      this.updateMetaThemeColor('#f8fafc');
    }

    // Dispatch custom event for components that need to know about theme changes
    this.dispatchThemeChangeEvent(isDark);
  }

  private updateMetaThemeColor(color: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', color);
  }

  private dispatchThemeChangeEvent(isDark: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { isDark, theme: this.currentTheme.value }
    }));
  }

  private saveTheme(theme: ThemeType): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  // Public methods
  setTheme(theme: ThemeType): void {
    this.currentTheme.next(theme);
    this.saveTheme(theme);
    
    let isDark: boolean;
    
    switch (theme) {
      case 'dark':
        isDark = true;
        break;
      case 'light':
        isDark = false;
        break;
      case 'auto':
      default:
        isDark = this.getSystemThemePreference();
        break;
    }
    
    this.applyTheme(isDark);
    this.isDarkTheme.next(isDark);
  }

  toggleTheme(): void {
    const currentTheme = this.currentTheme.value;
    const isDark = this.isDarkTheme.value;
    
    if (currentTheme === 'auto') {
      // If auto, switch to opposite of current system theme
      this.setTheme(isDark ? 'light' : 'dark');
    } else {
      // If manual, toggle between light and dark
      this.setTheme(isDark ? 'light' : 'dark');
    }
  }

  // Utility methods
  getCurrentTheme(): ThemeType {
    return this.currentTheme.value;
  }

  isDark(): boolean {
    return this.isDarkTheme.value;
  }

  isLight(): boolean {
    return !this.isDarkTheme.value;
  }

  isAuto(): boolean {
    return this.currentTheme.value === 'auto';
  }
}