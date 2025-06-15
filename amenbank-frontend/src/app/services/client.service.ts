// src/app/services/client.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { tap, catchError, map } from 'rxjs/operators';
import { 
  BankAccount, 
  Transaction, 
  CreateTransactionRequest, 
  TransactionFilterRequest,
  TransactionType
} from '../models/client.models';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:8089/client';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Account management
  getCurrentUserAccounts(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${this.baseUrl}/accounts`);
  }

  getUserAccounts(userId: number): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${this.baseUrl}/accounts/${userId}`);
  }

  createAccount(account: Partial<BankAccount>): Observable<BankAccount> {
    return this.http.post<BankAccount>(`${this.baseUrl}/accounts`, account);
  }

  // Transaction management
  getAccountTransactions(
    accountId: number,
    filters?: {
      type?: TransactionType;
      from?: string;
      to?: string;
      min?: number;
      max?: number;
    }
  ): Observable<Transaction[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.from) params = params.set('from', filters.from);
      if (filters.to) params = params.set('to', filters.to);
      if (filters.min !== undefined) params = params.set('min', filters.min.toString());
      if (filters.max !== undefined) params = params.set('max', filters.max.toString());
    }

    return this.http.get<Transaction[]>(`${this.baseUrl}/accounts/${accountId}/transactions`, { params });
  }

  createTransaction(accountId: number, request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/accounts/${accountId}/transactions`, request)
      .pipe(
        tap(() => {
          // Navigate to transactions page with success message
          this.router.navigate(['/client/transactions'], {
            state: { success: 'Transaction créée avec succès' }
          });
        })
      );
  }

  filterTransactions(request: TransactionFilterRequest): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(`${this.baseUrl}/transactions/filter`, request);
  }

  // Bulk import
  importBulkTransactions(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.baseUrl}/transactions/import-csv`, formData, { responseType: 'text' })
      .pipe(
        tap((response) => {
          console.log('CSV Import Response:', response);
        }),
        map(response => ({ success: true, message: response })),
        catchError((error: HttpErrorResponse) => {
          console.error('CSV Import Error Details:', error);
          
          let errorMessage = 'Erreur lors de l\'import du fichier CSV';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}