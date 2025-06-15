import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BankAccount } from '../models/client.models';

@Injectable({
  providedIn: 'root'
})
export class AdminBankAccountService {
  private apiUrl = `${environment.apiUrl}/api/admin/accounts`;

  constructor(private http: HttpClient) { }

  /**
   * Get all bank accounts with pagination and filtering
   */
  getAllAccounts(
    page: number = 0, 
    size: number = 10, 
    sortBy: string = 'id', 
    sortDir: string = 'asc',
    filters?: { iban?: string, accountNumber?: string, type?: string, userId?: number }
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    
    if (filters) {
      if (filters.iban) params = params.set('iban', filters.iban);
      if (filters.accountNumber) params = params.set('accountNumber', filters.accountNumber);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.userId) params = params.set('userId', filters.userId.toString());
    }
    
    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Get a specific bank account by ID
   */
  getAccountById(id: number): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new bank account
   */
  createAccount(account: BankAccount): Observable<BankAccount> {
    return this.http.post<BankAccount>(this.apiUrl, account);
  }

  /**
   * Update an existing bank account
   */
  updateAccount(id: number, account: BankAccount): Observable<BankAccount> {
    return this.http.put<BankAccount>(`${this.apiUrl}/${id}`, account);
  }

  /**
   * Delete a bank account
   */
  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get account types for dropdown
   */
  getAccountTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }

  /**
   * Search users for account assignment
   */
  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`, {
      params: new HttpParams().set('query', query)
    });
  }
} 