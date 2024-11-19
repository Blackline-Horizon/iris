import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

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
export class AppComponent {}
