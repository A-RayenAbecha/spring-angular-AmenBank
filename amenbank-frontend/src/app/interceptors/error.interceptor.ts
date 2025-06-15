import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur inconnue est survenue !';
      
      // Skip redirection for auth-related endpoints
      const isAuthEndpoint = 
        req.url.includes('/api/auth/login') || 
        req.url.includes('/api/auth/signup') ||
        req.url.includes('/api/auth/register');
      
      console.log('🔄 Error interceptor - URL:', req.url, 'Status:', error.status);
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
        if (!isAuthEndpoint) {
          router.navigate(['/error'], { queryParams: { type: 'client' } });
        }
      } else {
        // Server-side error
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          // Clear token and redirect to login
          authService.logout();
          router.navigate(['/login']);
        } else if (error.status === 403) {
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
          if (!isAuthEndpoint) {
            router.navigate(['/error'], { queryParams: { type: '403' } });
          }
        } else if (error.status === 404) {
          errorMessage = 'Ressource non trouvée.';
          if (!isAuthEndpoint) {
            router.navigate(['/error'], { queryParams: { type: '404' } });
          }
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          if (!isAuthEndpoint) {
            router.navigate(['/error'], { queryParams: { type: '500' } });
          }
        } else {
          // Only redirect for non-auth endpoints
          if (!isAuthEndpoint) {
            router.navigate(['/error']);
          }
        }
        
        // Use server error message if available
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }

      // Show error message to user
      snackBar.open(errorMessage, 'Fermer', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      return throwError(() => error);
    })
  );
}; 