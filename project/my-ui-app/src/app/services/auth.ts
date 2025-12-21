import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  role: string;   // 👈 BACKEND PROVIDES ROLE SEPARATELY
  tokens: {
    access: string;
    refresh: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://internshiphcl-production.up.railway.app/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login/`, { email, password })
      .pipe(
        tap(response => {

          // Save tokens
          localStorage.setItem('access_token', response.tokens.access);
          localStorage.setItem('refresh_token', response.tokens.refresh);

          // Save user details
          localStorage.setItem('user', JSON.stringify(response.user));

          // ⚡ Save role separately
          localStorage.setItem('role', response.role);

          // Update observable
          this.currentUserSubject.next({
            ...response.user,
            role: response.role     // 👈 include role
          });
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }
}
