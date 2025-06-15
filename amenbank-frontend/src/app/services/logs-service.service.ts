
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginEvent {
  id?: number;
  username: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export interface LogFilter {
  start?: Date | string;
  end?: Date | string;
  username?: string;
  ipAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = 'http://localhost:8089/admin/monitoring';

  constructor(private http: HttpClient) { }

  getAllLogs(): Observable<LoginEvent[]> {
    return this.http.get<LoginEvent[]>(`${this.apiUrl}/logins`);
  }

  getFilteredLogs(filter: LogFilter): Observable<LoginEvent[]> {
    let params = new HttpParams();
    
    if (filter.start) {
      params = params.set('start', filter.start.toString());
    }
    
    if (filter.end) {
      params = params.set('end', filter.end.toString());
    }
    
    if (filter.username) {
      params = params.set('username', filter.username);
    }
    
    if (filter.ipAddress) {
      params = params.set('ipAddress', filter.ipAddress);
    }

    return this.http.get<LoginEvent[]>(`${this.apiUrl}/logins`, { params });
  }

  // Additional methods for log analysis
  getLogsByDateRange(start: string, end: string): Observable<LoginEvent[]> {
    const params = new HttpParams()
      .set('start', start)
      .set('end', end);
    
    return this.http.get<LoginEvent[]>(`${this.apiUrl}/logins`, { params });
  }

  getLogsByUser(username: string): Observable<LoginEvent[]> {
    const params = new HttpParams().set('username', username);
    return this.http.get<LoginEvent[]>(`${this.apiUrl}/logins`, { params });
  }

  getLogsByIP(ipAddress: string): Observable<LoginEvent[]> {
    const params = new HttpParams().set('ipAddress', ipAddress);
    return this.http.get<LoginEvent[]>(`${this.apiUrl}/logins`, { params });
  }
}