import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface TransferNotification {
  id: number;
  message: string;
  notificationDate: string;
  scheduledExecutionDate: string;
  isReminder: boolean;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransferNotificationService {
  private apiUrl = 'http://localhost:8089/api/notifications';
  private notificationsSubject = new BehaviorSubject<TransferNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startPolling();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUnreadNotifications(): Observable<TransferNotification[]> {
    return this.http.get<TransferNotification[]>(`${this.apiUrl}/unread`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(notifications.filter(n => !n.isRead).length);
      })
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, null, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNotifications())
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, null, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.refreshNotifications())
    );
  }

  refreshNotifications(): void {
    this.getUnreadNotifications().subscribe();
  }

  private startPolling() {
    setInterval(() => {
      this.refreshNotifications();
    }, 30000); // Poll every 30 seconds
  }
} 