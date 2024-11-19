// src/app/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    
    // Uncomment this section once AWS Cognito authentication is ready
    /*
    if (this.isUserAuthenticatedWithCognito()) {
      return true;
    }
    */
    
    // Temporary solution: check if the user is authenticated (simulated with localStorage)
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated) {
      return true;
    } else {
      // Redirect to login if not authenticated
      this.router.navigate(['/login']);
      return false;
    }
  }

  // This function will be used to check real AWS Cognito authentication once AWS is integrated
  private isUserAuthenticatedWithCognito(): boolean {
    // Replace this with the Cognito authentication check when you're ready
    // Example: return AWS.CognitoIdentityServiceProvider.getCurrentUser() !== null;
    return false; // Placeholder until AWS Cognito is integrated
  }
}
