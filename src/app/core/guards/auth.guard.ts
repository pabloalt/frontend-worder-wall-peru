import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = async () => {
  if (environment.bypassAuth) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    await auth.loadUser();
  }

  if (auth.isAuthenticated() && auth.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
