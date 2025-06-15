import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AdminScheduledTransfer {
  id: number;
  sourceAccount: string;
  sourceAccountId?: number;
  targetAccountNumber: string;
  destinationAccount?: string;
  amount: number;
  frequency: string;
  startDate?: string;
  endDate?: string;
  nextExecutionDate?: string;
  status: string;
  description?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminScheduledTransferService {
  private apiUrl = 'http://localhost:8089/api/admin/scheduled-transfers';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  // Get all scheduled transfers
  getAllScheduledTransfers(
    page: number = 0, 
    size: number = 10, 
    sortBy: string = 'id', 
    sortDir: string = 'asc',
    filters?: { sourceAccount?: string, destinationAccount?: string, status?: string }
  ): Observable<any> {
    let params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);
    
    if (filters) {
      // Map frontend filter names to backend field names
      if (filters.sourceAccount) params.append('sourceAccount', filters.sourceAccount);
      if (filters.destinationAccount) params.append('targetAccountNumber', filters.destinationAccount);
      if (filters.status) {
        // Map status filter to active parameter if needed
        if (filters.status === 'ACTIVE') {
          params.append('active', 'true');
        } else if (filters.status === 'INACTIVE') {
          params.append('active', 'false');
        } else {
          params.append('status', filters.status);
        }
      }
    }
    
    return this.http.get<any>(`${this.apiUrl}?${params.toString()}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get a scheduled transfer by ID
  getScheduledTransferById(id: number): Observable<AdminScheduledTransfer> {
    return this.http.get<AdminScheduledTransfer>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Create a new scheduled transfer
  createScheduledTransfer(transfer: AdminScheduledTransfer): Observable<AdminScheduledTransfer> {
    const backendTransfer = {
      ...transfer,
      targetAccountNumber: transfer.destinationAccount || transfer.targetAccountNumber
    };
    
    return this.http.post<AdminScheduledTransfer>(this.apiUrl, backendTransfer, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update a scheduled transfer
  updateScheduledTransfer(id: number, transfer: AdminScheduledTransfer): Observable<AdminScheduledTransfer> {
    const backendTransfer = {
      ...transfer,
      targetAccountNumber: transfer.destinationAccount || transfer.targetAccountNumber
    };
    
    return this.http.put<AdminScheduledTransfer>(`${this.apiUrl}/${id}`, backendTransfer, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Delete a scheduled transfer
  deleteScheduledTransfer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
} 