import { Component, HostListener, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { StateService } from './services/state.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, SidebarComponent, CommonModule],
  template: `
    <div class="flex flex-col md:flex-row">
      <div
        class="md:hidden bg-black p-6 flex justify-between items-center"
        [ngClass]="{
          hidden:
            showSidebar === false && hideSidebarRoutes.includes(router.url)
        }"
      >
        <div class="text-[#ae142a] text-xl font-bold">
          <span class="text-white">blackline</span>horizon
        </div>

        <button (click)="toggleSidebar()" class="text-white text-3xl">
          &#9776;
        </button>
      </div>

      <app-sidebar
        [isVisible]="showSidebar"
        (toggleSidebarEvent)="toggleSidebar()"
      >
      </app-sidebar>

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AppComponent implements OnInit {
  showSidebar: boolean = true;

  hideSidebarRoutes: string[] = ['/login', '/register', '/confirm'];

  constructor(public router: Router, private stateService: StateService) {
    const isAuthenticated = this.stateService.getState('isAuthenticated');

    if (isAuthenticated === false) {
      this.stateService.clearState();
      this.router.navigate(['/login']);
    }

    this.router.events.subscribe((event) => {
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

    if (this.hideSidebarRoutes.includes(currentRoute)) {
      this.showSidebar = false;
    } else {
      this.showSidebar = true;
    }

    this.checkScreenSize();
  }

  checkScreenSize() {
    if (window.innerWidth >= 768) {
      if (!this.hideSidebarRoutes.includes(this.router.url)) {
        this.showSidebar = true;
      }
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
