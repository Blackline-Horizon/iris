import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.css'],
  imports: [FormsModule, CommonModule],
})
export class ConfirmEmailComponent {
  username!: string;
  confirmationCode!: string;
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  confirmEmail(): void {
    this.authService.confirmSignUp(this.username, this.confirmationCode).then(
      (result) => {
        this.router.navigate(['/login']);
      },
      (error) => {
        this.errorMessage = error.message;
      }
    );
  }
}
