// /Users/shanzi/iris/iris/src/app/components/dashboard/metric-card/metric-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.css']
})
export class MetricCardComponent {
  @Input() icon: string = 'fa-chart-line';
  @Input() value: string | number = 0;
  @Input() label: string = '';
}