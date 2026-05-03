import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface UserInfo {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'ww_admin';

  currentUser = signal<UserInfo | null>(this.loadFromSession());
  isAuthenticated = signal(this.loadFromSession() !== null);

  constructor(private router: Router) {}

  private loadFromSession(): UserInfo | null {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): boolean {
    const user = environment.users.find(
      u => u.email === email && u.password === password
    );
    if (!user) return false;

    const info: UserInfo = { name: user.name, email: user.email };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(info));
    this.currentUser.set(info);
    this.isAuthenticated.set(true);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string {
    return environment.adminToken;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
