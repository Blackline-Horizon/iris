import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { StateService } from './services/state.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, SidebarComponent, CommonModule],
  template: `
    <div class="flex flex-col md:flex-row">
      <!-- Mobile hamburger button -->
      <div class="md:hidden bg-gray-800 p-4">
        <button (click)="toggleSidebar()" class="text-white text-2xl">
          &#9776; <!-- Hamburger icon -->
        </button>
      </div>

      <!-- Sidebar component -->
      <app-sidebar 
        [isVisible]="showSidebar" 
        (toggleSidebarEvent)="toggleSidebar()">
      </app-sidebar>

      <!-- Main content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  showSidebar: boolean = true;

  constructor(private stateService: StateService, private router: Router) {
    const isAuthenticated = this.stateService.getState('isAuthenticated');

    if (isAuthenticated === false) {
      this.stateService.clearState();
      this.router.navigate(['/login']);
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkRoute();
      }
    });
  }

  ngOnInit() {
    this.checkRoute();
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  checkRoute() {
    const currentRoute = this.router.url;
    const hideSidebarRoutes = ['/login', '/signup', '/confirm'];

    if (hideSidebarRoutes.includes(currentRoute)) {
      this.showSidebar = false;
    } else {
      this.showSidebar = true;
    }
  }

  checkScreenSize() {
    if (window.innerWidth >= 768) {
      this.showSidebar = true;
    } else {
      this.showSidebar = false;
    }
  }

  toggleSidebar() {
    if (window.innerWidth < 768) {
      this.showSidebar = !this.showSidebar;
    }
  }
}
