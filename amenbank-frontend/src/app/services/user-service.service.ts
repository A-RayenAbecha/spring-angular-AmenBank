import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export enum Role {
  CLIENT = 'CLIENT',
  ADMIN = 'SUPERADMIN',
  EMPLOYEE = 'RESPONSABLE'
}

export interface User {
  id?: number;
  username: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;  // ISO string format
  cin?: string;
  email: string;
  password?: string;
  role: Role | string;
  enabled?: boolean;
  accountNonLocked?: boolean;
  failedLoginAttempts?: number;
  twoFactorEnabled?: boolean;
  lastLogin?: string;  // ISO string datetime
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:8089/admin/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.baseUrl, user).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, user).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(id: number): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}/reset-password`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Method to get roles (useful for debugging)
  getRoles(): Role[] {
    return Object.values(Role);
  }

  // Method to get role display names
  getRoleDisplayName(role: Role | string): string {
    switch(role) {
      case Role.CLIENT: return 'Client';
      case Role.ADMIN: return 'Super Administrateur';
      case Role.EMPLOYEE: return 'Responsable';
      default: return role.toString();
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Erreur backend:', error);
    let message = 'Une erreur est survenue, veuillez réessayer.';
    if (error.error && error.error.message) {
      message = error.error.message;
    }
    return throwError(() => new Error(message));
  }
}