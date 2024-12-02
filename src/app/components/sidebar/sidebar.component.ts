import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

  toggleSidebar() {
    this.toggleSidebarEvent.emit(!this.isVisible);
  }

  closeSidebar() {
    if (window.innerWidth < 768) {
      this.toggleSidebarEvent.emit(false);
    }
  }
}
