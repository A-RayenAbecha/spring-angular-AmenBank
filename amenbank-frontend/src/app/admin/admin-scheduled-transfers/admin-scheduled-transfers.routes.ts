import { Routes } from '@angular/router';
import { AdminScheduledTransferListComponent } from './admin-scheduled-transfer-list.component';
import { AuthGuard } from '../../guards/auth.guard';
import { adminGuard } from '../../guards/admin.guard';

export const ADMIN_SCHEDULED_TRANSFERS_ROUTES: Routes = [
  {
    path: '',
    component: AdminScheduledTransferListComponent,
    canActivate: [AuthGuard, adminGuard],
    title: 'Gestion des Virements Permanents'
  }
]; 