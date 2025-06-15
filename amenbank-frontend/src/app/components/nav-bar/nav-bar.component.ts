import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="nav-bar" *ngIf="!isAuthenticated">
      <div class="nav-content">
        <a routerLink="/home" class="nav-brand">AmenBank</a>
        <div class="nav-links">
          <a routerLink="/home" routerLinkActive="active">Accueil</a>
          <a routerLink="/login" routerLinkActive="active">Connexion</a>
          <a routerLink="/register" routerLinkActive="active">Inscription</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-bar {
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1976d2;
      text-decoration: none;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: #333;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s;
    }

    .nav-links a:hover {
      background-color: #f5f5f5;
    }

    .nav-links a.active {
      color: #1976d2;
      font-weight: 500;
    }
  `]
})
export class NavBarComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Subscribe to auth state changes
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        isAuthenticated => {
          console.log('🔥 Auth state changed:', isAuthenticated);
          this.isAuthenticated = isAuthenticated;
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 