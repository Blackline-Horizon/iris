import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, CommonModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .login(this.username, this.password)
      .then(() => {
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        if (error.code === 'UserNotConfirmedException') {
          this.errorMessage = 'Your account has not been verified, please check your email';
        } else if (error.code === 'UserNotFoundException') {
          this.errorMessage = 'Your account does not exist';
        } else {
          this.errorMessage = 'Your credentials are invalid';
        }
      });
  }
}
