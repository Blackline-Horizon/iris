import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [FormsModule, CommonModule],
})
export class SignupComponent {
  username: string = '';
  password: string = '';
  email: string = '';
  firstName: string = '';
  lastName: string = '';
  errorMessage: string = '';

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
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        if (error.code === 'UsernameExistsException') {
          this.errorMessage =
            'Username already exists. Please choose a different username.';
        } else if (error.code === 'InvalidPasswordException') {
          this.errorMessage =
            'Password does not meet the strength requirements.';
        } else if (error.code === 'UserNotConfirmedException') {
          this.errorMessage =
            'Your account has not been verified, please check your email.';
        } else if (error.code === 'UserNotFoundException') {
          this.errorMessage = 'Your account does not exist.';
        } else if (error.code === 'InvalidParameterException') {
          this.errorMessage =
            'Invalid input parameters. Please check your entries.';
        } else if (error.code === 'LimitExceededException') {
          this.errorMessage =
            'Too many sign-up attempts. Please try again later.';
        } else if (error.code === 'CodeDeliveryFailureException') {
          this.errorMessage =
            'There was an issue sending the verification code. Please try again.';
        } else if (error.code === 'NotAuthorizedException') {
          this.errorMessage =
            'You are not authorized to sign up. Please contact support.';
        } else if (error.code === 'TooManyRequestsException') {
          this.errorMessage = 'Too many requests. Please try again later.';
        } else if (error.code === 'InternalErrorException') {
          this.errorMessage =
            'An unexpected error occurred. Please try again later.';
        } else {
          this.errorMessage = 'An unknown error occurred. Please try again.';
        }
      });
  }
}
