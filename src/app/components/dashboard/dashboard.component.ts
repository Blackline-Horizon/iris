import { Component } from '@angular/core';
import { StateService } from '../../services/state.service';
import { LogoutButtonComponent } from '../../shared/logout-button.component';
import { NgxChartsModule } from '@swimlane/ngx-charts'; // Import NgxChartsModule

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LogoutButtonComponent, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  username: string | null = null;
  jwt: string | null = null;

  constructor(private stateService: StateService) {
    this.username = this.stateService.getState('username');
  }

  barChartData = [
    { name: 'Product A', value: 4500 },
    { name: 'Product B', value: 7200 },
    { name: 'Product C', value: 6100 }
  ];

  pieChartData = [
    { name: 'Chrome', value: 60 },
    { name: 'Firefox', value: 20 },
    { name: 'Safari', value: 15 },
    { name: 'Other', value: 5 }
  ];

  colorScheme = { domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5'] };
}
