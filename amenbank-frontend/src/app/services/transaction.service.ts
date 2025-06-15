import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Transaction {
  id: number;
  date: Date;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  accountId: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/api/transactions`;

  constructor(private http: HttpClient) {}

  getRecentTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/recent`);
  }

  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  createTransaction(transaction: Omit<Transaction, 'id' | 'date' | 'status'>): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  updateTransactionStatus(id: number, status: Transaction['status']): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/status`, { status });
  }
} 