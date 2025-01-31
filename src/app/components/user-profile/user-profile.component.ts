import { Component } from '@angular/core';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {

    username: string | null = null;
    firstName: string | null = null;
    lastName: string | null = null;
    email: string | null = null;

    constructor(private stateService: StateService){
      this.username = stateService.getState("username");
      this.firstName = stateService.getState("firstName");
      this.lastName = stateService.getState("lastName");
      this.email = stateService.getState("email");
    }
}
