import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Input() isVisible: boolean = true;
  @Output() toggleSidebarEvent = new EventEmitter<boolean>();

  isMobile: boolean = window.innerWidth < 768; 

  constructor(private authService: AuthService) {}

  toggleSidebar() {

    this.toggleSidebarEvent.emit(!this.isVisible);
  }

  closeSidebar() {

    if (this.isMobile) {
      this.toggleSidebarEvent.emit(false);
    }
  }

  logout() {
    this.authService.logout();
  }


  onResize(event: Event) {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}
