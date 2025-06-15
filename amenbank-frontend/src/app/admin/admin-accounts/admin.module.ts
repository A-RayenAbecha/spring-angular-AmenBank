import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Components
import { AdminAccountListComponent } from './admin-account-list.component';
import { AdminAccountFormComponent } from './admin-account-form.component';

// Routes
import { ADMIN_ACCOUNTS_ROUTES } from './admin-accounts.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ACCOUNTS_ROUTES),
    
    // Standalone Components
    AdminAccountListComponent,
    AdminAccountFormComponent
  ],
  providers: []
})
export class AdminAccountsModule { } 