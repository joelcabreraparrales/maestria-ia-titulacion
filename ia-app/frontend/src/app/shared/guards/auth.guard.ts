import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (tokenStorage.isAuthenticated()) {
    return true;
  }

  // Token exists but expired — clean up stale session data
  if (tokenStorage.getToken()) {
    tokenStorage.clear();
  }

  return router.createUrlTree(['/signin']);
};
