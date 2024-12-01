// src/app/components/logout-button/logout-button.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  template: `<button (click)="logout()">Logout</button>`,
  styleUrls: ['./logout-button.component.css']
})
export class LogoutButtonComponent {
  constructor(private router: Router, private stateService: StateService) {}

  logout() {
    // Set isAuthenticated to false, this clears the state
    this.stateService.setState('isAuthenticated', false);
    this.router.navigate(['/login']); // Redirect to login page
  }
}
