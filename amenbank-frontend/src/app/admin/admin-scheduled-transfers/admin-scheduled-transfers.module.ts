import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { AdminScheduledTransferListComponent } from './admin-scheduled-transfer-list.component';
import { AdminScheduledTransferFormComponent } from './admin-scheduled-transfer-form.component';

// Routes
import { ADMIN_SCHEDULED_TRANSFERS_ROUTES } from './admin-scheduled-transfers.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_SCHEDULED_TRANSFERS_ROUTES),
    
    // Standalone Components
    AdminScheduledTransferListComponent,
    AdminScheduledTransferFormComponent
  ],
  providers: []
})
export class AdminScheduledTransfersModule { } 