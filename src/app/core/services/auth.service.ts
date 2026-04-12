import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface UserInfo {
  name?: string;
  email?: string;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Azure Static Web Apps inserts user identity at /.auth/me
  private readonly authEndpoint = '/.auth/me';
  private readonly adminRole = 'admin';

  currentUser = signal<UserInfo | null>(null);
  isAuthenticated = signal(false);

  constructor(private router: Router) {}

  async loadUser(): Promise<void> {
    try {
      const res = await fetch(this.authEndpoint);
      if (res.ok) {
        const data = await res.json();
        const client = data?.clientPrincipal;
        if (client) {
          this.currentUser.set({
            name: client.userDetails,
            email: client.userDetails,
            roles: client.userRoles
          });
          this.isAuthenticated.set(true);
          return;
        }
      }
    } catch { /* no auth in dev */ }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  isAdmin(): boolean {
    return this.currentUser()?.roles?.includes(this.adminRole) ?? false;
  }

  getToken(): string | null {
    // Azure SWA handles auth via cookies, no local JWT needed
    return null;
  }

  login(): void {
    window.location.href = '/.auth/login/aad';
  }

  logout(): void {
    window.location.href = '/.auth/logout';
  }
}
