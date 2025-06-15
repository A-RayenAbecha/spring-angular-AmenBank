// src/app/components/client-layout/client-layout.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LogoutService } from '../services/logout.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, ThemeToggleComponent],
  template: `
    <div class="client-layout theme-transition">
      <!-- Navigation Header -->
      <header class="client-header theme-transition">
        <div class="header-content">
          <div class="logo-section">
            
          </div>
          
          <nav class="main-nav">
            <a routerLink="/client/dashboard" 
               routerLinkActive="active"
               class="nav-link theme-transition">
              <mat-icon>dashboard</mat-icon>
              <span class="nav-text">Tableau de Bord</span>
            </a>
            <a routerLink="/client/transactions" 
               routerLinkActive="active"
               class="nav-link theme-transition">
              <mat-icon>receipt_long</mat-icon>
              <span class="nav-text">Transactions</span>
            </a>
            <a routerLink="/client/scheduled-transfers" 
               routerLinkActive="active"
               class="nav-link theme-transition">
              <mat-icon>sync_alt</mat-icon>
              <span class="nav-text">Virements Permanents</span>
            </a>
            <a routerLink="/client/accounts" 
               routerLinkActive="active"
               class="nav-link theme-transition">
              <mat-icon>account_balance</mat-icon>
              <span class="nav-text">Comptes</span>
            </a>
            <a routerLink="/client/credit/simulation" 
               routerLinkActive="active"
               class="nav-link theme-transition">
              <mat-icon>calculate</mat-icon>
              <span class="nav-text">Simulation Crédit</span>
            </a>
            <a routerLink="/client/credit/application" 
               routerLinkActive="active"
               class="nav-link theme-transition">
              <mat-icon>request_quote</mat-icon>
              <span class="nav-text">Demande Crédit</span>
            </a>
          </nav>

          <div class="user-actions">
            <app-theme-toggle></app-theme-toggle>
            <button mat-button class="btn-logout theme-transition" (click)="onLogout()">
              <mat-icon>logout</mat-icon>
              <span class="btn-text">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="client-main theme-transition">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="client-footer theme-transition">
        <p>&copy; 2024 Bank System. Tous droits réservés.</p>
      </footer>
    </div>
  `,
  styles: [`
    .client-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--background);
      color: var(--text-primary);
    }

    .client-header {
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }

    .logo-section h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--sidebar-text);
    }

    .welcome-text {
      font-size: 14px;
      opacity: 0.9;
      display: block;
      margin-top: 2px;
      color: var(--sidebar-text);
    }

    .main-nav {
      display: flex;
      gap: 30px;
    }

    .nav-link {
      color: var(--sidebar-text);
      text-decoration: none;
      padding: 10px 15px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      opacity: 0.8;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        opacity: 1;
        transform: translateY(-1px);
      }

      &.active {
        background-color: var(--primary);
        opacity: 1;
        box-shadow: var(--shadow);
      }
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .btn-logout {
      background-color: #ef4444 !important;
      color: white !important;
      border: none !important;
      padding: 6px 16px !important;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);

      &:hover {
        background-color: #dc2626 !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .client-main {
      flex: 1;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      background-color: var(--background);
    }

    .client-footer {
      background-color: var(--surface);
      color: var(--text-primary);
      text-align: center;
      padding: 20px;
      margin-top: auto;
      border-top: 1px solid var(--border);

      p {
        margin: 0;
        font-size: 14px;
        opacity: 0.8;
      }
    }

    /* Dark mode enhancements */
    :host-context(.dark-theme) {
      .btn-logout {
        background-color: #dc2626 !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

        &:hover {
          background-color: #b91c1c !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
      }
    }

    /* Light mode enhancements */
    :host-context(.light-theme) {
      .btn-logout {
        background-color: #ef4444 !important;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);

        &:hover {
          background-color: #dc2626 !important;
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
        }
      }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .header-content {
        padding: 0 15px;
      }

      .client-main {
        padding: 15px;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-wrap: wrap;
        height: auto;
        padding: 10px 15px;
        gap: 10px;
      }

      .logo-section {
        width: 100%;
        text-align: center;
      }

      .main-nav {
        order: 2;
        width: 100%;
        justify-content: center;
        gap: 10px;
        overflow-x: auto;
        padding: 5px 0;
      }

      .nav-link {
        padding: 8px 12px;
        font-size: 14px;
        white-space: nowrap;
      }

      .nav-text {
        display: none;
      }

      .user-actions {
        position: absolute;
        top: 10px;
        right: 15px;
      }

      .btn-text {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .logo-section h1 {
        font-size: 20px;
      }

      .welcome-text {
        font-size: 12px;
      }

      .nav-link {
        padding: 6px 10px;
      }

      .client-main {
        padding: 10px;
      }
    }
  `]
})
export class ClientLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private logoutService: LogoutService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout() {
    this.logoutService.initiateLogout();
  }
}