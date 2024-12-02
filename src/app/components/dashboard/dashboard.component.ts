import { Component } from '@angular/core';
import { StateService } from '../../services/state.service';
import { LogoutButtonComponent } from '../../shared/logout-button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LogoutButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  username: string | null = null;
  jwt: string | null = null;

  constructor(private stateService: StateService) {
    this.username = this.stateService.getState('username');
  }
}
