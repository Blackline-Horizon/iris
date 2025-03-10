// /Users/shanzi/iris/iris/src/app/components/dashboard/charts/bar-chart/bar-chart.component.ts
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
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = 'Count';
  
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
    
    // Prepare the data
    const labels = this.data.map(item => this.formatLabel(item.name));
    const values = this.data.map(item => item.value);
    
    // Generate colors
    const colors = this.generateColors(this.data.length);
    
    // Create the chart
    this.chart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => this.adjustBrightness(color, -20)),
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 50,
          barPercentage: 0.8,
          hoverBackgroundColor: colors.map(color => this.adjustBrightness(color, 20))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            displayColors: false,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                return `${context.dataset.data[context.dataIndex]}`;
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
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              display: false
            },
            ticks: {
              color: '#aaa',
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 45
            },
            title: {
              display: this.xAxisLabel !== '',
              text: this.xAxisLabel,
              color: '#aaa',
              font: {
                size: 12
              },
              padding: {
                top: 10
              }
            }
          },
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
            },
            title: {
              display: this.yAxisLabel !== '',
              text: this.yAxisLabel,
              color: '#aaa',
              font: {
                size: 12
              },
              padding: {
                bottom: 10
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 0,
            bottom: 10
          }
        }
      }
    });
  }
  
  private formatLabel(name: string): string {
    // Format name for better display
    if (!name) return 'Unknown';
    
    // Replace underscores with spaces
    let formatted = name.replace(/_/g, ' ');
    
    // Capitalize each word
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formatted;
  }
  
  private generateColors(count: number): string[] {
    const baseColors = [
      '#e74c3c', // Red
      '#3498db', // Blue
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Teal
      '#34495e', // Dark Blue
      '#e67e22', // Dark Orange
      '#27ae60', // Dark Green
      '#d35400'  // Dark Red
    ];
    
    // If count <= baseColors.length, return the first 'count' baseColors
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // Otherwise, generate variations
    const colors: string[] = [...baseColors];
    
    while (colors.length < count) {
      const randomIndex = Math.floor(Math.random() * baseColors.length);
      const baseColor = baseColors[randomIndex];
      
      // Create a variation with saturation and lightness changes
      const variation = this.createColorVariation(baseColor);
      colors.push(variation);
    }
    
    return colors;
  }
  
  private createColorVariation(hexColor: string): string {
    // Convert hex to HSL
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      
      h /= 6;
    }
    
    // Create variation
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    // Adjust hue slightly
    h = (h + Math.floor(Math.random() * 20) - 10) % 360;
    if (h < 0) h += 360;
    
    // Adjust saturation and lightness
    s = Math.max(40, Math.min(90, s + Math.floor(Math.random() * 20) - 10));
    l = Math.max(30, Math.min(70, l + Math.floor(Math.random() * 20) - 10));
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  
  private adjustBrightness(color: string, amount: number): string {
    // Simple brightness adjustment for HSL colors
    if (color.startsWith('hsl')) {
      const regex = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/;
      const matches = regex.exec(color);
      
      if (matches && matches.length === 4) {
        const h = parseInt(matches[1], 10);
        const s = parseInt(matches[2], 10);
        const l = parseInt(matches[3], 10);
        
        return `hsl(${h}, ${s}%, ${Math.max(0, Math.min(100, l + amount))}%)`;
      }
    }
    
    return color;
  }
}