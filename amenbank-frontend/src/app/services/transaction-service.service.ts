import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id?: number;
  date: string;
  amount: number;
  balanceAfter: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  description: string;
  account?: {
    id: number;
    accountNumber: string;
    user: {
      username: string;
    };
  };
}

export interface TransactionFilter {
  start?: string | Date;
  end?: string | Date;
  type?: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  username?: string;
}

export interface DashboardData {
  lastTransactions: Transaction[];
  anomalyDetected: Transaction[];
}

export interface KPIData {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  transactionsByType: {
    [key: string]: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8089/admin/monitoring';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }


private formatDate(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString(); // Return full ISO string with time
  }
  return date;
}

getFilteredTransactions(filter: TransactionFilter): Observable<Transaction[]> {
  let params = new HttpParams();
  
  if (filter.start) {
    params = params.set('start', this.formatDate(filter.start));
  }
  if (filter.end) {
    params = params.set('end', this.formatDate(filter.end));
  }
  if (filter.type) {
    params = params.set('type', filter.type);
  }
  if (filter.username) {
    params = params.set('username', filter.username);
  }

  return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, {
    headers: this.getAuthHeaders(),
    params: params
  });
}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`, {
      headers: this.getAuthHeaders()
    });
  }

  getKPI(): Observable<KPIData> {
    return this.http.get<KPIData>(`${this.apiUrl}/kpi`, {
      headers: this.getAuthHeaders()
    });
  }
}