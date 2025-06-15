import { Routes } from '@angular/router';
import { AdminLoanListComponent } from './admin-loan-list.component';
import { AdminLoanDetailComponent } from './admin-loan-detail.component';
import { AuthGuard } from '../../guards/auth.guard';
import { adminGuard } from '../../guards/admin.guard';

export const ADMIN_LOANS_ROUTES: Routes = [
  {
    path: '',
    component: AdminLoanListComponent,
    canActivate: [AuthGuard, adminGuard],
    title: 'Gestion des Demandes de Crédit'
  },
  {
    path: ':id',
    component: AdminLoanDetailComponent,
    canActivate: [AuthGuard, adminGuard],
    title: 'Détails de la Demande de Crédit'
  }
]; 