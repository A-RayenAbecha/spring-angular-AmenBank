import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <h1>404</h1>
        <h2>Page Non Trouvée</h2>
        <p>La page que vous recherchez n'existe pas ou vous n'avez pas les permissions nécessaires pour y accéder.</p>
        <button mat-raised-button color="primary" routerLink="/">
          <mat-icon>home</mat-icon>
          Retour à l'accueil
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--gray-50);
      padding: var(--spacing-4);
    }

    .not-found-content {
      text-align: center;
      max-width: 600px;
      padding: var(--spacing-8);
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--primary);
      margin-bottom: var(--spacing-4);
    }

    h1 {
      font-size: 72px;
      font-weight: 700;
      color: var(--primary);
      margin: 0 0 var(--spacing-4);
      line-height: 1;
    }

    h2 {
      font-size: var(--font-size-2xl);
      color: var(--gray-900);
      margin: 0 0 var(--spacing-4);
    }

    p {
      color: var(--gray-600);
      margin: 0 0 var(--spacing-6);
      line-height: 1.6;
    }

    button {
      gap: var(--spacing-2);
    }
  `]
})
export class NotFoundComponent {} 