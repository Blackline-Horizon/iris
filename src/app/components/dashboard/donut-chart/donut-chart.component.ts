import {
    Component,
    OnInit,
    Input,
    ViewChild,
    ElementRef,
    OnChanges,
    SimpleChanges
  } from '@angular/core';
  import { Chart } from 'chart.js/auto';
  
  @Component({
    selector: 'app-donut-chart',
    standalone: true,
    templateUrl: './donut-chart.component.html',
    styleUrls: ['./donut-chart.component.css']
  })
  export class DonutChartComponent implements OnInit, OnChanges {
    @Input() count: number = 0;
    @Input() chartLabel: string = '';
  
    @ViewChild('donutCanvas', { static: true }) donutCanvas!: ElementRef;
    private chart: Chart | null = null;
  
    ngOnInit() {
      this.drawChart();
    }
  
    ngOnChanges(changes: SimpleChanges) {
      if (changes['count']) {
        this.drawChart();
      }
    }
  
    private drawChart() {
      if (!this.donutCanvas) return;
  
      if (this.chart) {
        this.chart.destroy();
      }
  

      const maxValue = 100;
      const portion = Math.min(this.count, maxValue);
      const remainder = maxValue - portion;
  
      this.chart = new Chart(this.donutCanvas.nativeElement.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: [this.chartLabel, 'Other'],
          datasets: [
            {
              data: [portion, remainder],
              backgroundColor: ['#d84f4f', '#3a3a3a'],
              hoverBackgroundColor: ['#b03838', '#5a5a5a'],
              borderColor: '#1a1a1a'
            }
          ]
        },
        options: {
          cutout: '70%',
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  }
  