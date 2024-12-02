import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [FormsModule],
})
export class SignupComponent {
  username: string = '';
  password: string = '';
  email: string = '';
  firstName: string = '';
  lastName: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .signUp(
        this.username,
        this.password,
        this.email,
        this.firstName,
        this.lastName
      )
      .then((result) => {
        console.log('Sign-up successful', result);
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Sign-up failed', error);
        alert(
          'Sign-up failed. Please check the provided details and try again.'
        );
      });
  }
}
