import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

// 1. IMPORTAR LineController
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
  BarController,
  BarElement
} from 'chart.js';
import { environment } from '../../../environments/environment';

// 2. REGISTRARLO AQUÍ
Chart.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  LineController,
  BarController,
  BarElement
);

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './metrics.component.html'
})
export class MetricsComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  loading = true;
  stats: any = null;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Duración (s)',
        fill: true,
        tension: 0.4,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#4f46e5',
        pointHoverBackgroundColor: '#4f46e5',
        pointHoverBorderColor: '#fff'
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
    }
  };

public barChartData: ChartConfiguration<'bar'>['data'] = {
  labels: [],
  datasets: []
};

public barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: true, position: 'bottom' },
    tooltip: { mode: 'index', intersect: false }  
  },
  scales: {
      y: { 
        beginAtZero: true, 
        stacked: true,
        ticks: { stepSize: 1 } 
      },
      x: { 
        stacked: true,
        grid: { display: false } 
      }
  }
};

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchMetrics();
  }

  fetchMetrics() {
    this.loading = true;
    
    this.http.get<any>(`${this.apiUrl}/api/metrics`).subscribe({
      next: (data) => {        
        this.stats = data;
        this.lineChartData.labels = data.history.map((h: any) => h.build);
        this.lineChartData.datasets[0].data = data.history.map((h: any) => parseFloat(h.duration));
        this.lineChartData = { ...this.lineChartData };

        this.barChartData.labels = data.deploymentFrequency.labels;
        
        this.barChartData.datasets = data.deploymentFrequency.datasets;
        
        this.barChartData = { ...this.barChartData };
        
        this.loading = false;

        setTimeout(() => {
            this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Error en métricas:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}