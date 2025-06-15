import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ScheduledTransfer, ScheduledTransferRequest, ScheduledTransferUpdateRequest } from '../models/scheduled-transfer';

@Injectable({
  providedIn: 'root'
})
export class ScheduledTransferService {
  private apiUrl = 'http://localhost:8089/api/scheduled-transfers';

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

  // Validate if an account exists
  validateAccount(accountNumber: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/validate-account/${accountNumber}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Create a new scheduled transfer
  createScheduledTransfer(request: ScheduledTransferRequest): Observable<ScheduledTransfer> {
    return this.http.post<ScheduledTransfer>(this.apiUrl, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get all active scheduled transfers
  getActiveTransfers(): Observable<ScheduledTransfer[]> {
    return this.http.get<ScheduledTransfer[]>(`${this.apiUrl}/active`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update a scheduled transfer
  updateScheduledTransfer(id: number, request: ScheduledTransferUpdateRequest): Observable<ScheduledTransfer> {
    return this.http.put<ScheduledTransfer>(`${this.apiUrl}/update/${id}`, request, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Cancel a scheduled transfer
  cancelScheduledTransfer(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/cancel/${id}`, null, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }
} 