import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { 
  LoanApplicationRequest, 
  LoanApplicationResponse,
  LoanStatus
} from '../models/credit.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminLoanService {
  private apiUrl = `${environment.apiUrl}/api/admin/loans`;

  constructor(private http: HttpClient) {}

  getAllLoanApplications(): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}`);
  }

  getLoanApplicationsByStatus(status: LoanStatus): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}/status/${status}`);
  }

  getLoanApplicationById(id: number): Observable<LoanApplicationResponse> {
    return this.http.get<LoanApplicationResponse>(`${this.apiUrl}/${id}`);
  }

  createLoanApplication(request: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.http.post<LoanApplicationResponse>(`${this.apiUrl}`, request);
  }

  updateLoanApplication(id: number, request: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.http.put<LoanApplicationResponse>(`${this.apiUrl}/${id}`, request);
  }

  updateLoanStatus(id: number, status: LoanStatus): Observable<LoanApplicationResponse> {
    console.log(`Updating loan status for ID ${id} to ${status}`);
    
    return this.http.patch<LoanApplicationResponse>(
      `${this.apiUrl}/${id}/status`, 
      { status }, 
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      catchError(error => {
        console.error('Error in updateLoanStatus:', error);
        console.error('Status code:', error.status);
        console.error('Error message:', error.message);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        return throwError(() => error);
      })
    );
  }

  deleteLoanApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 