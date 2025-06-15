import { Routes } from '@angular/router';
import { AdminAccountListComponent } from './admin-account-list.component';
import { AuthGuard } from '../../guards/auth.guard';
import { adminGuard } from '../../guards/admin.guard';

export const ADMIN_ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    component: AdminAccountListComponent,
    canActivate: [AuthGuard, adminGuard],
    title: 'Gestion des Comptes Bancaires'
  }
]; 