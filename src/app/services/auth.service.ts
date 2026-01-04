import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, token: string) {
    return this.http.post<any>(`${this.apiUrl}/api/login`, { username, password: token });
  }

  saveSession(user: string, token: string) {
    localStorage.setItem('idp_token', token);
    localStorage.setItem('idp_user', user);
    this.currentUserSubject.next({ username: user });
  }

  logout() {
    localStorage.removeItem('idp_token');
    localStorage.removeItem('idp_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('idp_token');
  }

  getUserFromStorage() {
    const user = localStorage.getItem('idp_user');
    return user ? { username: user } : null;
  }
}