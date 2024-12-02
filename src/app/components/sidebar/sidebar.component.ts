import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule], // Import RouterModule for routerLink
  template: `
    <nav *ngIf="isVisible" 
         class="bg-gray-800 text-white w-64 min-h-screen p-4 fixed top-0 left-0 z-50 md:relative md:flex md:flex-col md:w-64 
         transition-transform transform md:translate-x-0"
         [class.translate-x-full]="!isVisible">
      
      <!-- Close button for mobile view -->
      <div class="md:hidden flex justify-end">
        <button (click)="closeSidebar()" class="text-white text-3xl">
          &#10005; <!-- X icon -->
        </button>
      </div>

      <!-- Sidebar Links -->
      <ul class="space-y-4 mt-8">
        <li>
          <a 
            routerLink="/dashboard" 
            routerLinkActive="active" 
            class="block py-2 px-4 rounded hover:bg-gray-700"
            (click)="closeSidebar()">
            Dashboard
          </a>
        </li>
        <li>
          <a 
            routerLink="/map" 
            routerLinkActive="active" 
            class="block py-2 px-4 rounded hover:bg-gray-700"
            (click)="closeSidebar()">
            Map
          </a>
        </li>
        <li>
          <a 
            routerLink="/reports" 
            routerLinkActive="active" 
            class="block py-2 px-4 rounded hover:bg-gray-700"
            (click)="closeSidebar()">
            Reports
          </a>
        </li>
        <li>
          <a 
            routerLink="/settings" 
            routerLinkActive="active" 
            class="block py-2 px-4 rounded hover:bg-gray-700"
            (click)="closeSidebar()">
            Settings
          </a>
        </li>
        <li>
          <a 
            routerLink="/user-profile" 
            routerLinkActive="active" 
            class="block py-2 px-4 rounded hover:bg-gray-700"
            (click)="closeSidebar()">
            Profile
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    nav {
      transition: transform 0.3s ease-in-out;
    }
    .active {
      background-color: #2d3748;
    }
    .translate-x-full {
      transform: translateX(100%);
    }

    /* Mobile view: Sidebar takes full width */
    @media (max-width: 767px) {
      nav {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999;
        background-color: rgba(0, 0, 0, 1); /* Semi-transparent background */
      }
    }
  `]
})
export class SidebarComponent {
  @Input() isVisible: boolean = true;  // Whether sidebar is visible
  @Output() toggleSidebarEvent = new EventEmitter<boolean>();  // Emit toggle event

  toggleSidebar() {
    this.toggleSidebarEvent.emit(!this.isVisible);  // Toggle visibility
  }

  closeSidebar() {
    if (window.innerWidth < 768) {
      this.toggleSidebarEvent.emit(false);  // Close sidebar on mobile
    }
  }
}
