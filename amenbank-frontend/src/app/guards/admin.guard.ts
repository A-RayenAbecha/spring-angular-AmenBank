import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  console.log('🔍 AdminGuard checking authentication...');
  
  // First check if user is authenticated
  if (!authService.isAuthenticated()) {
    console.log('❌ AdminGuard: Not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
  
  // Then check the role
  const role = authService.getRole();
  console.log('🔍 AdminGuard - User role:', role);
  
  if (role === 'SUPERADMIN') {
    console.log('✅ AdminGuard: Admin role verified, access granted');
    return true;
  } else {
    console.log('❌ AdminGuard: Not an admin, redirecting');
    // If user is client, redirect to client dashboard
    if (role === 'CLIENT') {
      router.navigate(['/client/dashboard']);
    } else {
      router.navigate(['/home']);
    }
    return false;
  }
}; 