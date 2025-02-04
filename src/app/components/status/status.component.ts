import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environment/environment.local';

interface ServiceUrls {
  ATHENA: string;
  ATLAS: string;
  HERMES: string;
  HESTIA: string;
  NYX: string;
  ORACLE: string;
}

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit {
  serviceStatus: { [key in keyof ServiceUrls]: string } = {
    ATHENA: 'Checking...',
    ATLAS: 'Checking...',
    HERMES: 'Checking...',
    HESTIA: 'Checking...',
    NYX: 'Checking...',
    ORACLE: 'Checking...',
  };

  private serviceUrls: ServiceUrls = {
    ATHENA: environment.ATHENA,
    ATLAS: environment.ATLAS,
    HERMES: environment.HERMES,
    HESTIA: environment.HESTIA,
    NYX: environment.NYX,
    ORACLE: environment.ORACLE,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    Object.keys(this.serviceUrls).forEach((service) => {
      this.checkServiceStatus(service as keyof ServiceUrls, this.serviceUrls[service as keyof ServiceUrls]);
    });
  }

  private checkServiceStatus(service: keyof ServiceUrls, url: string): void {
    this.http.get(url, { responseType: 'text' }).subscribe(
      () => {
        this.serviceStatus[service] = 'Live';
      },
      () => {
        this.serviceStatus[service] = 'Down';
      }
    );
  }
}
