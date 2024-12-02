import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .login(this.username, this.password)
      .then(() => {
        this.router.navigate(['/dashboard']);
      })
      .catch((error) => {
        console.error('Login failed', error);
        alert('Login failed. Please check your credentials and try again.');
      });
  }
}
