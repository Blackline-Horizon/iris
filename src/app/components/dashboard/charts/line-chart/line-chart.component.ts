// /Users/shanzi/iris/iris/src/app/components/dashboard/charts/line-chart/line-chart.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { formatDate } from '@angular/common';

// Define interface locally to avoid import issues
interface EventRecord {
  id: number;
  date_created: string;
  name: string;
  assigned_user?: string;
  resolution_reason: string;
  sensor_type: string;
  event_type: string;
  industry: string;
  device_type: string;
  current_status: string;
  country_name: string;
  lat?: number;
  lng?: number;
  [key: string]: any; // Index signature to allow accessing properties by string
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit, OnChanges {
  @Input() data: { date: string, value: number }[] = [];
  @Input() groupBy: string | null = null;
  @Input() alerts: EventRecord[] = [];
  @Input() title: string = '';
  
  @ViewChild('lineCanvas', { static: true }) lineCanvas!: ElementRef;
  private chart: Chart | null = null;
  
  ngOnInit(): void {
    if (this.data && this.data.length > 0) {
      this.createChart();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['groupBy'] || changes['alerts']) && this.data && this.data.length > 0) {
      this.createChart();
    }
  }
  
  private createChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare the data
    const labels = this.data.map(item => this.formatDate(item.date));
    
    // If groupBy is null, create a simple line chart
    if (!this.groupBy || this.groupBy === 'none' || !this.alerts || this.alerts.length === 0) {
      const values = this.data.map(item => item.value);
      
      this.chart = new Chart(this.lineCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Alerts',
            data: values,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#e74c3c',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#e74c3c',
            pointHoverBorderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: this.getChartOptions()
      });
    } else {
      // For grouped data, process the actual grouping
      const groupedData = this.groupAlertsByDateAndType();
      
      const datasets = Object.entries(groupedData).map(([group, dataPoints], index) => {
        const color = this.getGroupColor(index);
        
        return {
          label: this.formatGroupName(group),
          data: dataPoints,
          borderColor: color,
          backgroundColor: this.hexToRgba(color, 0.1),
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true
        };
      });
      
      this.chart = new Chart(this.lineCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: this.getChartOptions(true)
      });
    }
  }
  
  private getChartOptions(showLegend: boolean = false): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          labels: {
            color: '#aaa',
            font: {
              size: 11
            },
            padding: 15,
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true
          }
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
          borderWidth: 1
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
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      elements: {
        line: {
          borderJoinStyle: 'round'
        }
      }
    };
  }
  
  private formatDate(dateStr: string): string {
    // Format the date (this is a simple implementation, adjust as needed)
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  private groupAlertsByDateAndType(): Record<string, number[]> {
    if (!this.groupBy || !this.alerts || this.alerts.length === 0) {
      return {};
    }
    
    // Step 1: Get all unique dates and group types
    const dates = [...new Set(this.data.map(item => item.date))].sort();
    const groupValues = [...new Set(this.alerts.map(alert => alert[this.groupBy as keyof EventRecord]))];
    
    // Step 2: Create an empty result structure
    const result: Record<string, Record<string, number>> = {};
    groupValues.forEach(groupValue => {
      if (groupValue !== undefined && groupValue !== null) {
        result[String(groupValue)] = {};
        dates.forEach(date => {
          result[String(groupValue)][date] = 0;
        });
      }
    });
    
    // Step 3: Fill in the data
    this.alerts.forEach(alert => {
      const date = alert.date_created.split(' ')[0]; // Extract YYYY-MM-DD
      if (this.groupBy && alert[this.groupBy] !== undefined && alert[this.groupBy] !== null) {
        const groupValue = String(alert[this.groupBy]);
        
        if (dates.includes(date) && groupValue && result[groupValue]) {
          result[groupValue][date] = (result[groupValue][date] || 0) + 1;
        }
      }
    });
    
    // Step 4: Convert to format needed for Chart.js
    const chartData: Record<string, number[]> = {};
    Object.entries(result).forEach(([groupValue, dateCounts]) => {
      chartData[groupValue] = dates.map(date => dateCounts[date] || 0);
    });
    
    // Step 5: Only keep groups that represent at least 10% of the largest group
    const groupSums = Object.entries(chartData).map(([group, values]) => ({
      group,
      sum: values.reduce((acc, val) => acc + val, 0)
    }));
    
    groupSums.sort((a, b) => b.sum - a.sum);
    
    if (groupSums.length > 0) {
      const largestSum = groupSums[0].sum;
      const threshold = largestSum * 0.1;
      
      const mainGroups = groupSums.filter(item => item.sum >= threshold);
      const smallGroups = groupSums.filter(item => item.sum < threshold);
      
      if (smallGroups.length > 0) {
        // Combine small groups into "Other"
        const otherValues = dates.map((_, dateIndex) => {
          return smallGroups.reduce((sum, { group }) => {
            return sum + chartData[group][dateIndex];
          }, 0);
        });
        
        // Keep only main groups and add "Other"
        const filteredChartData: Record<string, number[]> = {};
        mainGroups.forEach(({ group }) => {
          filteredChartData[group] = chartData[group];
        });
        
        if (otherValues.some(v => v > 0)) {
          filteredChartData['Other'] = otherValues;
        }
        
        return filteredChartData;
      }
    }
    
    return chartData;
  }
  
  private getGroupColor(index: number): string {
    const colors = [
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
    
    return colors[index % colors.length];
  }
  
  private formatGroupName(name: string): string {
    // Format group names to be more readable
    if (!name) return 'Unknown';
    
    // Replace underscores with spaces
    let formatted = name.replace(/_/g, ' ');
    
    // Capitalize each word
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formatted;
  }
  
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}