import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  template: `<button (click)="logout()">Logout</button>`,
  styleUrls: ['./logout-button.component.css']
})
export class LogoutButtonComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
