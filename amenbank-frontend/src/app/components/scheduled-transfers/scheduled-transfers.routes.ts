import { Routes } from '@angular/router';
import { ScheduledTransferListComponent } from './scheduled-transfer-list.component';

export const SCHEDULED_TRANSFERS_ROUTES: Routes = [
  {
    path: '',
    component: ScheduledTransferListComponent,
    title: 'Virements Permanents'
  }
]; 