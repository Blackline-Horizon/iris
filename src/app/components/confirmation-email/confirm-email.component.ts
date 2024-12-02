// src/app/components/confirm-email/confirm-email.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.css'],
  imports: [FormsModule], // Add FormsModule here for ngModel
})
export class ConfirmEmailComponent {
  username!: string;
  confirmationCode!: string;
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  confirmEmail(): void {
    this.authService.confirmSignUp(this.username, this.confirmationCode).then(
      (result) => {
        this.router.navigate(['/login']); // Navigate to login after successful confirmation
      },
      (error) => {
        this.errorMessage = error.message; // Display error message if the confirmation fails
      }
    );
  }
}
