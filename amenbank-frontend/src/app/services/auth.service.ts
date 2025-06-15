import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { tap, map, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

// Define interfaces locally to avoid import issues
interface LoginResponse {
  message?: string;
  role?: string;
  token?: string;
  user?: User;
  twoFactorRequired?: boolean;
}

interface RegisterRequest {
  username: string;
  first_name: string;
  last_name: string;
  dateOfBirth: string;
  cin: string;
  email: string;
  password: string;
  role: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Fix the baseUrl to avoid double appending /api/auth
  private baseUrl = `${environment.apiUrl}/api/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly ROLE_KEY = 'user-role';
  private readonly USER_KEY = 'user_data';

  private jwtHelper = new JwtHelperService();
  private authStateSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public isAuthenticated$ = this.authStateSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔄 AuthService initialized with baseUrl:', this.baseUrl);
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem(this.USER_KEY);
      }
    }
  }

  loginSuccess(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    console.log('✅ Token saved with key:', this.TOKEN_KEY, 'Token:', token.substring(0, 20) + '...');
    this.authStateSubject.next(true);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  getUsername(): Observable<string> {
    return this.getCurrentUser().pipe(
      map(user => user?.username || 'Admin User')
    );
  }

  getFullName(): Observable<string> {
    return this.getCurrentUser().pipe(
      map(user => user ? `${user.firstName} ${user.lastName}` : 'Admin User')
    );
  }

  getRole(): string | null {
    // First try to get from the currentUserSubject
    const userRole = this.currentUserSubject.value?.role;
    if (userRole) {
      return userRole;
    }
    
    // If not available, try to extract from token
    const token = this.getToken();
    if (!token) {
      return null;
    }
    
    try {
      const decoded = this.jwtHelper.decodeToken(token);
      return decoded?.role || null;
    } catch (error) {
      console.error('Error decoding token for role:', error);
      return null;
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    console.log('🔄 Login request to:', `${this.baseUrl}/login`);
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { username, password }, {
      headers: { 'Content-Type': 'application/json' }
    })
      .pipe(
        tap(response => {
          console.log('✅ Login response received:', response);
          if (response.token) {
            localStorage.setItem(this.TOKEN_KEY, response.token);
            if (response.user) {
              localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
              this.currentUserSubject.next(response.user);
              this.authStateSubject.next(true);
            }
          }
        }),
        catchError(error => {
          console.error('❌ Login error:', error);
          console.error('❌ Login error status:', error.status);
          console.error('❌ Login error message:', error.message);
          if (error.error) {
            console.error('❌ Login error details:', error.error);
          }
          return throwError(() => error);
        })
      );
  }

  register(data: RegisterRequest): Observable<string> {
    console.log('🔄 Register request to:', `${this.baseUrl}/signup`);
    console.log('🔄 Register data:', data);
    
    return this.http.post(`${this.baseUrl}/signup`, data, { responseType: 'text' })
      .pipe(
        catchError(error => {
          console.error('❌ Register error:', error);
          return throwError(() => error);
        })
      );
  }

  verify2FA(data: { username: string; token: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/2fa-verify`, data)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem(this.TOKEN_KEY, response.token);
            this.authStateSubject.next(true);
          }
        })
      );
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.baseUrl}/forgot-password?email=${email}`, {});
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.baseUrl}/reset-password`, {
      token,
      newPassword
    }, {
      responseType: 'json' 
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem('pendingUsername');
    localStorage.removeItem(this.USER_KEY);
    this.authStateSubject.next(false);
    this.currentUserSubject.next(null);
    console.log('✅ Logout completed, tokens cleared');
  }

  getUsers(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/users`);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getUserData(): User | null {
    return this.currentUserSubject.value;
  }
}