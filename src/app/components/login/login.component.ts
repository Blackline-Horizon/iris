// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StateService } from '../../services/state.service'; // Import StateService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  constructor(private router: Router, private stateService: StateService) {}

  login() {
    // Set isAuthenticated to true in the state when user logs in
    this.stateService.setState('isAuthenticated', true);
    this.stateService.setState('username', 'JohnDoe'); // Example username, replace with actual logic
    this.router.navigate(['/dashboard']);
  }
}
