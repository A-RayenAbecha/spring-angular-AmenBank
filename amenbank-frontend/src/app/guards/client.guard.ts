// src/app/guards/client.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClientGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('🔍 ClientGuard checking authentication...');
    
    if (!this.authService.isAuthenticated()) {
      console.log('❌ ClientGuard: Not authenticated, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    
    const role = this.authService.getRole();
    console.log('🔍 ClientGuard - User role:', role);
    
    // Allow access for CLIENT role only
    if (role === 'CLIENT') {
      console.log('✅ Client role verified, access granted');
      return true;
    } else {
      console.log('❌ ClientGuard: Not a client, redirecting');
      // If user is admin, redirect to admin dashboard
      if (role === 'SUPERADMIN') {
        this.router.navigate(['/admin/users']);
      } else {
        this.router.navigate(['/home']);
      }
      return false;
    }
  }
}