import {
    Component,
    Input,
    OnInit,
    ViewChild,
    ElementRef,
    OnChanges,
    SimpleChanges
  } from '@angular/core';
  import { Chart } from 'chart.js/auto';
  import { EventRecord } from '../map/map-data.service';
  
  @Component({
    selector: 'app-multi-line-chart',
    standalone: true,
    templateUrl: './multi-line-chart.component.html',
    styleUrls: ['./multi-line-chart.component.css']
  })
  export class MultiLineChartComponent implements OnInit, OnChanges {
    @Input() events: EventRecord[] = [];
  
    @ViewChild('multiLineCanvas', { static: true }) multiLineCanvas!: ElementRef;
    private chart: Chart | null = null;
  
    constructor() {}
  
    ngOnInit(): void {
      this.buildOrUpdateChart();
    }
  
    ngOnChanges(changes: SimpleChanges): void {
      if (changes['events']) {
        this.buildOrUpdateChart();
      }
    }
  

    private buildOrUpdateChart() {
      if (!this.multiLineCanvas) return;
  

      if (this.chart) {
        this.chart.destroy();
      }

      const categorySet = new Set<string>();

      const dataByDateCategory: Record<string, Record<string, number>> = {};
  
      for (const e of this.events) {

        const dateKey = new Date(e.date_created).toISOString().substring(0, 10);
  
        let cat = '';
        if (e.device_event_type_id === 40) {
          cat = 'Fall';
        } else if (e.device_event_type_id === 42) {
          cat = 'Silent Alert';
        } else if (e.device_event_type_id === 43) {
          cat = 'Emergency';
        }
  
        if (!cat && e.gas_type) {
          cat = e.gas_type.toUpperCase();
        }
        if (!cat) continue;
  
        categorySet.add(cat);
  
        if (!dataByDateCategory[dateKey]) {
          dataByDateCategory[dateKey] = {};
        }
        if (!dataByDateCategory[dateKey][cat]) {
          dataByDateCategory[dateKey][cat] = 0;
        }
        dataByDateCategory[dateKey][cat]++;
      }
  
 
      const allDates = Object.keys(dataByDateCategory).sort();
  

      const categoriesArr = Array.from(categorySet).sort();
      const datasets = categoriesArr.map(cat => {

        const catData = allDates.map(date => dataByDateCategory[date][cat] || 0);
  

        const color = this.getColorForCategory(cat);
  
        return {
          label: cat,
          data: catData,
          borderColor: color,
          backgroundColor: 'transparent',
          tension: 0.2
        };
      });
  
      this.chart = new Chart(this.multiLineCanvas.nativeElement.getContext('2d'), {
        type: 'line',
        data: {
          labels: allDates,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#555' }
            },
            y: {
              beginAtZero: true,
              ticks: { color: '#fff' },
              grid: { color: '#555' }
            }
          },
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          }
        }
      });
    }
  

    private getColorForCategory(cat: string): string {

      let hash = 0;
      for (let i = 0; i < cat.length; i++) {
        hash = cat.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
      }
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 50%)`;
    }
  }
  