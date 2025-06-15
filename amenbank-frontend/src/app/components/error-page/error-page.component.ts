import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-container">
      <div class="error-content">
        <mat-icon class="error-icon">{{ errorIcon }}</mat-icon>
        <h1>{{ errorTitle }}</h1>
        <p>{{ errorMessage }}</p>
        
        <!-- For non-authenticated users -->
        <div *ngIf="!isAuthenticated" class="action-buttons">
          <button mat-raised-button color="primary" (click)="goHome()">
            <mat-icon>home</mat-icon>
            Retour à l'accueil
          </button>
          <button mat-raised-button color="accent" (click)="goToRegister()">
            <mat-icon>person_add</mat-icon>
            Créer un compte
          </button>
        </div>

        <!-- For authenticated users -->
        <div *ngIf="isAuthenticated" class="action-buttons">
          <button mat-raised-button color="primary" (click)="goToDashboard()">
            <mat-icon>dashboard</mat-icon>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }
    .error-content {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 90%;
    }
    .error-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #f44336;
      margin-bottom: 1rem;
    }
    h1 {
      margin-bottom: 1rem;
      color: #333;
    }
    p {
      margin-bottom: 2rem;
      color: #666;
    }
    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    button {
      margin: 0.5rem;
    }
  `]
})
export class ErrorPageComponent implements OnInit {
  errorTitle = 'Error';
  errorMessage = 'An unexpected error occurred.';
  errorIcon = 'error';
  isAuthenticated = false;
  userRole: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check authentication status
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.userRole = this.authService.getRole();
    }

    // Set error details based on type
    this.route.queryParams.subscribe(params => {
      const errorType = params['type'];
      switch (errorType) {
        case '404':
          this.errorTitle = '404 - Page Non Trouvée';
          this.errorMessage = 'La page que vous recherchez n\'existe pas.';
          this.errorIcon = 'search_off';
          break;
        case '500':
          this.errorTitle = '500 - Erreur Serveur';
          this.errorMessage = 'Une erreur est survenue sur nos serveurs. Veuillez réessayer plus tard.';
          this.errorIcon = 'cloud_off';
          break;
        case '403':
          this.errorTitle = '403 - Accès Refusé';
          this.errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.';
          this.errorIcon = 'gpp_bad';
          break;
        default:
          this.errorTitle = 'Erreur Inattendue';
          this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
          this.errorIcon = 'error';
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToDashboard() {
    if (this.userRole === 'SUPERADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/client/dashboard']);
    }
  }
} 