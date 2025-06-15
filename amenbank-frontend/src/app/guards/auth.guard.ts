import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { type CanActivateFn } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  canActivate(route?: ActivatedRouteSnapshot): boolean {
    console.log('🔥 AuthGuard checking authentication...');
    
    if (!this.authService.isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    // Check for required roles
    const requiredRoles = route?.data?.['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = this.authService.getRole();
      console.log('🔥 User role:', userRole, 'Required roles:', requiredRoles);
      
      if (!userRole || !requiredRoles.includes(userRole)) {
        console.log('❌ Insufficient permissions');
        this.router.navigate(['/home']); // Or '/unauthorized'
        return false;
      }
    }

    console.log('✅ Authentication and authorization successful');
    return true;
  }
}

// Alternative: Create a separate AdminGuard for admin routes
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    const role = this.authService.getRole();
    if (role !== 'SUPERADMIN') {
      console.log('❌ Access denied. Required role: SUPERADMIN, Current role:', role);
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  console.log('🔍 AuthGuard function checking route:', state.url);
  
  // Public routes that are always accessible
  const publicRoutes = ['/home', '/login', '/register', '/forgot-password', '/reset-password'];
  
  if (publicRoutes.some(route => state.url.startsWith(route))) {
    console.log('✅ Public route access granted:', state.url);
    return true;
  }
  
  // Check if user is authenticated for protected routes
  const isAuthenticated = authService.isAuthenticated();
  console.log('🔍 User authenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
  
  // User is authenticated, allow access
  console.log('✅ User is authenticated, access granted to:', state.url);
  return true;
};