import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService, ThemeType } from '../../services/theme.service';
import { Subject, takeUntil, combineLatest } from 'rxjs';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      class="theme-toggle-btn"
      [matTooltip]="getTooltipText()">
      <mat-icon class="theme-icon">{{ getThemeIcon() }}</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu" class="theme-menu">
      <button mat-menu-item (click)="setTheme('light')" [class.active]="currentTheme === 'light'">
        <mat-icon>light_mode</mat-icon>
        <span>Mode clair</span>
        <mat-icon class="check-icon" *ngIf="currentTheme === 'light'">check</mat-icon>
      </button>
      
      <button mat-menu-item (click)="setTheme('dark')" [class.active]="currentTheme === 'dark'">
        <mat-icon>dark_mode</mat-icon>
        <span>Mode sombre</span>
        <mat-icon class="check-icon" *ngIf="currentTheme === 'dark'">check</mat-icon>
      </button>
      
      <button mat-menu-item (click)="setTheme('auto')" [class.active]="currentTheme === 'auto'">
        <mat-icon>brightness_auto</mat-icon>
        <span>Automatique</span>
        <mat-icon class="check-icon" *ngIf="currentTheme === 'auto'">check</mat-icon>
      </button>
    </mat-menu>
  `,
  styles: [`
    .theme-toggle-btn {
      transition: var(--theme-transition);
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: var(--spacing-2);
      height: 40px;
      width: 40px;
      border-radius: var(--radius-lg);
      
      &:hover {
        transform: rotate(15deg);
        background: var(--primary);
        border-color: var(--primary);
        color: white;
        box-shadow: var(--shadow);
        
        .theme-icon {
          color: white;
        }
      }
      
      &:focus {
        outline: 2px solid var(--primary-alpha);
        outline-offset: 2px;
      }
    }

    .theme-icon {
      transition: var(--theme-transition);
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--text-primary);
    }

    :host ::ng-deep .theme-menu {
      .mat-mdc-menu-content {
        background-color: var(--surface) !important;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        padding: var(--spacing-2);
      }
      
      .mat-mdc-menu-item {
        color: var(--text-primary) !important;
        height: 48px;
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: 0 var(--spacing-4);
        border-radius: var(--radius-md);
        margin-bottom: 2px;
        transition: var(--theme-transition);
        
        &:hover {
          background-color: var(--surface-hover) !important;
        }
        
        &.active {
          background-color: var(--primary-alpha) !important;
          color: var(--primary) !important;
          
          mat-icon {
            color: var(--primary) !important;
          }
        }
        
        span {
          flex: 1;
          color: inherit;
        }
        
        .check-icon {
          color: var(--primary) !important;
          font-size: 18px;
        }
        
        mat-icon:first-child {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: var(--text-secondary);
        }
        
        &.active mat-icon:first-child {
          color: var(--primary) !important;
        }
      }
    }

    // Accessibility improvements
    @media (prefers-reduced-motion: reduce) {
      .theme-toggle-btn,
      .theme-icon {
        transition: none;
      }
      
      .theme-toggle-btn:hover {
        transform: none;
      }
    }
  `]
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  isDarkTheme = false;
  currentTheme: ThemeType = 'auto';
  
  private destroy$ = new Subject<void>();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Subscribe to both theme state and current theme type
    combineLatest([
      this.themeService.isDarkTheme$,
      this.themeService.currentTheme$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([isDark, theme]) => {
      this.isDarkTheme = isDark;
      this.currentTheme = theme;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTheme(theme: ThemeType): void {
    this.themeService.setTheme(theme);
  }

  getThemeIcon(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'auto':
        return 'brightness_auto';
      default:
        return 'brightness_auto';
    }
  }

  getTooltipText(): string {
    switch (this.currentTheme) {
      case 'light':
        return 'Mode clair actif';
      case 'dark':
        return 'Mode sombre actif';
      case 'auto':
        return `Mode automatique (${this.isDarkTheme ? 'sombre' : 'clair'})`;
      default:
        return 'Changer le thème';
    }
  }
}