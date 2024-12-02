import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StateService } from './services/state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  constructor(private stateService: StateService, private router: Router) {
    const isAuthenticated = this.stateService.getState('isAuthenticated');

    if (isAuthenticated === false) {
      this.stateService.clearState();
      this.router.navigate(['/login']);
    }
  }
}
