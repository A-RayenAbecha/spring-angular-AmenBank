import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  LoanSimulationRequest, 
  LoanSimulationResponse, 
  LoanApplicationRequest, 
  LoanApplicationResponse 
} from '../models/credit.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CreditService {
  private apiUrl = `${environment.apiUrl}/client/loans`;

  constructor(private http: HttpClient) {}

  simulateLoan(request: LoanSimulationRequest): Observable<LoanSimulationResponse> {
    return this.http.post<LoanSimulationResponse>(`${this.apiUrl}/simulate`, request);
  }

  applyForLoan(request: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.http.post<LoanApplicationResponse>(`${this.apiUrl}/apply`, request);
  }

  getMyLoanApplications(): Observable<LoanApplicationResponse[]> {
    return this.http.get<LoanApplicationResponse[]>(`${this.apiUrl}/my-applications`);
  }

  getLoanApplication(id: number): Observable<LoanApplicationResponse> {
    return this.http.get<LoanApplicationResponse>(`${this.apiUrl}/applications/${id}`);
  }
} 