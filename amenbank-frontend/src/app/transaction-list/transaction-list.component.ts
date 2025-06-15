// src/app/components/transaction-list/transaction-list.component.ts

import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../services/client.service';
import { Transaction, TransactionType, BankAccount } from '../models/client.models';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit, OnChanges {
  @Input() accountId: number | null = null;
  @Input() transactions: Transaction[] = [];
  @Input() showFilters: boolean = true;
  @Input() pageSize: number = 10;
  @Input() showPagination: boolean = true;
  public Math = Math; 

  // Component state
  filteredTransactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  loading = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalTransactions = 0;

  // Filters
  filters = {
    type: '' as TransactionType | '',
    startDate: '',
    endDate: '',
    minAmount: null as number | null,
    maxAmount: null as number | null,
    description: ''
  };

  // Sorting
  sortField: keyof Transaction = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Enums for template
  TransactionType = TransactionType;

  constructor(private clientService: ClientService) {}

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions'] && !changes['transactions'].firstChange) {
      this.processTransactions();
    }
    if (changes['accountId'] && !changes['accountId'].firstChange) {
      this.loadTransactions();
    }
  }

  private initializeComponent() {
    if (this.accountId) {
      this.loadTransactions();
    } else if (this.transactions.length > 0) {
      this.processTransactions();
    }
  }

  loadTransactions() {
    if (!this.accountId) return;

    this.loading = true;
    this.errorMessage = '';

    this.clientService.getAccountTransactions(this.accountId, {
      type: this.filters.type || undefined,
      from: this.filters.startDate || undefined,
      to: this.filters.endDate || undefined,
      min: this.filters.minAmount || undefined,
      max: this.filters.maxAmount || undefined
    }).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.processTransactions();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Erreur lors du chargement des transactions';
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    if (this.accountId) {
      // If we have an accountId, reload from server with filters
      this.loadTransactions();
    } else {
      // Otherwise, filter locally
      this.processTransactions();
    }
  }

  private processTransactions() {
    let filtered = [...this.transactions];

    // Apply filters
    if (this.filters.type) {
      filtered = filtered.filter(t => t.type === this.filters.type);
    }

    if (this.filters.startDate) {
      const startDate = new Date(this.filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }

    if (this.filters.endDate) {
      const endDate = new Date(this.filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }

    if (this.filters.minAmount !== null) {
      filtered = filtered.filter(t => t.amount >= this.filters.minAmount!);
    }

    if (this.filters.maxAmount !== null) {
      filtered = filtered.filter(t => t.amount <= this.filters.maxAmount!);
    }

    if (this.filters.description) {
      const searchTerm = this.filters.description.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return this.sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    this.filteredTransactions = filtered;
    this.totalTransactions = filtered.length;
    this.totalPages = Math.ceil(this.totalTransactions / this.pageSize);
    this.updateDisplayedTransactions();
  }

  updateDisplayedTransactions() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedTransactions = this.filteredTransactions.slice(start, end);
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.updateDisplayedTransactions();
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedTransactions();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedTransactions();
    }
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.updateDisplayedTransactions();
  }

  clearFilters() {
    this.filters = {
      type: '',
      startDate: '',
      endDate: '',
      minAmount: null,
      maxAmount: null,
      description: ''
    };
    this.onFilterChange();
  }

  onSort(field: keyof Transaction) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.processTransactions();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getTransactionTypeClass(type: string): string {
    return type.toLowerCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refreshTransactions() {
    if (this.accountId) {
      this.loadTransactions();
    } else {
      this.processTransactions();
    }
  }
}