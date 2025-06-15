import { Routes } from '@angular/router';
import { UsersFormComponent } from './users-form/users-form.component';
import { AuthGuard } from './guards/auth.guard';
import { ClientGuard } from './guards/client.guard';
import { adminGuard } from './guards/admin.guard';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ErrorPageComponent } from './components/error-page/error-page.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-2fa',
    loadComponent: () => import('./verify2fa/verify2fa.component').then(m => m.Verify2FAComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },

  // 🔒 Client section with ClientGuard
  {
    path: 'client',
    canActivate: [ClientGuard],
    loadComponent: () => import('../app/client-layout/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../app/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
      },
      {
        path: 'transactions',
        loadComponent: () => import('../app/pages/transactions-page/transactions-page.component').then(m => m.TransactionsPageComponent),
      },
      {
        path: 'scheduled-transfers',
        loadChildren: () => import('./components/scheduled-transfers/scheduled-transfers.routes').then(m => m.SCHEDULED_TRANSFERS_ROUTES)
      },
      {
        path: 'accounts',
        loadComponent: () => import('../app/pages/accounts-page/accounts-page.component').then(m => m.AccountsPageComponent),
      },
      {
        path: 'credit',
        loadChildren: () => import('./credit/credit.routes').then(m => m.CREDIT_ROUTES)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // 🔒 Admin section with AdminGuard
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'users',
        loadComponent: () => import('./users-management/users-management.component').then(m => m.UsersManagementComponent),
      },
      { 
        path: 'users/new', 
        component: UsersFormComponent 
      },
      { 
        path: 'users/edit/:id', 
        component: UsersFormComponent 
      },
      {
        path: 'transactions',
        loadComponent: () => import('./transactions/transactions.component').then(m => m.TransactionsComponent),
      },
      {
        path: 'logs',
        loadComponent: () => import('./logs/logs.component').then(m => m.LogsComponent),
      },
      {
        path: 'loans',
        loadChildren: () => import('./admin/admin-loans/admin-loans.routes').then(m => m.ADMIN_LOANS_ROUTES)
      },
      {
        path: 'accounts',
        loadChildren: () => import('./admin/admin-accounts/admin-accounts.routes').then(m => m.ADMIN_ACCOUNTS_ROUTES)
      },
      {
        path: 'scheduled-transfers',
        loadChildren: () => import('./admin/admin-scheduled-transfers/admin-scheduled-transfers.routes').then(m => m.ADMIN_SCHEDULED_TRANSFERS_ROUTES)
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },

  // Error Pages
  {
    path: '404',
    component: NotFoundComponent
  },
  {
    path: 'error',
    component: ErrorPageComponent
  },

  // Wildcard redirect to 404
  {
    path: '**',
    redirectTo: 'error'
  },
];