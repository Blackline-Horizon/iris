import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit, OnChanges {
  @Input() data: { name: string, value: number }[] = [];
  @Input() title: string = '';
  
  @ViewChild('barCanvas', { static: true }) barCanvas!: ElementRef;
  private chart: Chart | null = null;
  
  ngOnInit(): void {
    if (this.data && this.data.length > 0) {
      this.createChart();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.data.length > 0) {
      this.createChart();
    }
  }
  
  private createChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    
    const labels = this.data.map(item => item.name);
    const values = this.data.map(item => item.value);
    
    // Generate colors based on the number of items
    const backgroundColors = this.generateColors(this.data.length);
    
    this.chart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => this.adjustColorBrightness(color, -15)),
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 10,
            right: 20,
            top: 20,
            bottom: 40
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(27, 27, 27, 0.95)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 6,
            displayColors: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                // Calculate total more carefully to avoid type errors
                const dataArray = context.chart.data.datasets[0].data;
                let total = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  const val = dataArray[i];
                  if (typeof val === 'number') {
                    total += val;
                  }
                }
                const percentage = Math.round((value / total) * 100);
                return `${value} (${percentage}%)`;
              }
            }
          },
          title: {
            display: this.title !== '',
            text: this.title,
            color: '#f0f0f0',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#aaa',
              font: {
                size: 11
              },
              padding: 8,
              precision: 0
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#aaa',
              font: {
                size: 11
              },
              padding: 8,
              maxRotation: 45,
              minRotation: 45,
              callback: function(value, index, values) {
                const label = this.getLabelForValue(value as number);
                return label.length > 15 ? label.slice(0, 12) + '...' : label;
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }
  
  // Generate a color palette based on the number of items
  private generateColors(count: number): string[] {
    const baseColors = [
      '#3498db', // Blue
      '#e74c3c', // Red
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Teal
      '#34495e', // Dark Blue
      '#e67e22', // Dark Orange
      '#27ae60', // Dark Green
      '#d35400'  // Dark Red
    ];
    
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // For more items, generate variations of the base colors
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const baseColor = baseColors[i % baseColors.length];
      const variation = i < baseColors.length ? 
        baseColor : this.adjustColorBrightness(baseColor, (i % 3 - 1) * 15);
      colors.push(variation);
    }
    
    return colors;
  }
  
  // Adjust color brightness
  private adjustColorBrightness(hex: string, percent: number): string {
    hex = hex.replace(/^\s*#|\s*$/g, '');
    
    // Convert 3 digit hex to 6 digits
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const adjustValue = (value: number): number => {
      const adjusted = value + Math.round(percent / 100 * 255);
      return Math.max(0, Math.min(255, adjusted));
    };
    
    return "#" + 
      ((1 << 24) + (adjustValue(r) << 16) + (adjustValue(g) << 8) + adjustValue(b))
      .toString(16).slice(1);
  }
}