import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';

import { TransactionService, Transaction, TransactionFilter } from '../services/transaction-service.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatOptionModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  loading = false;
  isLoading = false; // Added this property that your HTML is using
  error: string | null = null;
  errorMessage: string | null = null; // Added this property that your HTML is using

  // Filter properties
  filter: TransactionFilter = {};
  transactionTypes = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'];

  // Table columns - Added this property that your HTML is using
  displayedColumns: string[] = ['id', 'date', 'type', 'amount', 'balanceAfter', 'description', 'account', 'user'];

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.isLoading = true;
    this.error = null;
    this.errorMessage = null;
    
    this.transactionService.getFilteredTransactions(this.filter).subscribe({
      next: (data) => {
        this.transactions = data;
        this.filteredTransactions = data;
        this.loading = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load transactions. Please try again.';
        this.errorMessage = 'Failed to load transactions. Please try again.';
        this.loading = false;
        this.isLoading = false;
        console.error('Error loading transactions:', err);
      }
    });
  }

// Fix the applyFilter method in transactions.component.ts

applyFilter(): void {
  // Convert Date objects to ISO string format for the backend
  const filterToSend = { ...this.filter };
  
  if (filterToSend.start && filterToSend.start instanceof Date) {
    // Convert to full ISO string with time (start of day)
    const startDate = new Date(filterToSend.start);
    startDate.setHours(0, 0, 0, 0); // Set to start of day
    filterToSend.start = startDate.toISOString();
  }
  
  if (filterToSend.end && filterToSend.end instanceof Date) {
    // Convert to full ISO string with time (end of day)
    const endDate = new Date(filterToSend.end);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    filterToSend.end = endDate.toISOString();
  }
  
  this.loading = true;
  this.isLoading = true;
  this.error = null;
  this.errorMessage = null;
  
  this.transactionService.getFilteredTransactions(filterToSend).subscribe({
    next: (data) => {
      this.transactions = data;
      this.filteredTransactions = data;
      this.loading = false;
      this.isLoading = false;
    },
    error: (err) => {
      this.error = 'Failed to load transactions. Please try again.';
      this.errorMessage = 'Failed to load transactions. Please try again.';
      this.loading = false;
      this.isLoading = false;
      console.error('Error loading transactions:', err);
    }
  });
}

  clearFilter(): void {
    this.filter = {};
    this.loadTransactions();
  }

  // Added methods that your HTML might be using
  refreshTransactions(): void {
    this.loadTransactions();
  }

  exportTransactions(): void {
    // Implement export functionality
    console.log('Export transactions functionality to be implemented');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'DEPOSIT':
        return 'primary';
      case 'WITHDRAWAL':
        return 'warn';
      case 'TRANSFER':
        return 'accent';
      default:
        return '';
    }
  }

  trackByTransactionId(index: number, transaction: Transaction): number | undefined {
    return transaction.id;
  }
}