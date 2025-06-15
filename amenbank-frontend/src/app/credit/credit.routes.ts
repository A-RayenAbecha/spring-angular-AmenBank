import { Routes } from '@angular/router';
import { LoanSimulationComponent } from './loan-simulation/loan-simulation.component';
import { LoanApplicationComponent } from './loan-application/loan-application.component';

export const CREDIT_ROUTES: Routes = [
  {
    path: 'simulation',
    component: LoanSimulationComponent,
    title: 'Simulation de Crédit'
  },
  {
    path: 'application',
    component: LoanApplicationComponent,
    title: 'Demande de Crédit'
  }
]; 