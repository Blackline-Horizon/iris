// /Users/shanzi/iris/iris/src/app/components/dashboard/dashboard-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EventRecord {
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
}

export interface FilterOptions {
  sensorTypes: string[];
  industries: string[];
  eventTypes: string[];
  resolutionReasons: string[];
  deviceTypes: string[];
  countries: {
    EU: string[];
    'North America': string[];
    Other: string[];
  };
}

export interface AlertsResponse {
  alerts: EventRecord[];
  meta: {
    sensorTypes: string[];
    industries: string[];
    eventTypes: string[];
    resolutionReasons: string[];
    deviceTypes: string[];
    countries: {
      EU: string[];
      'North America': string[];
      Other: string[];
    };
  };
  metrics: {
    total_alerts: number;
    avg_alerts_per_day: number;
    distribution_data: {
      sensor_type: Record<string, number>;
      resolution_reason: Record<string, number>;
      device_type: Record<string, number>;
      industry: Record<string, number>;
      event_type: Record<string, number>;
      [key: string]: Record<string, number>; // Add index signature
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {
  private apiBaseUrl = 'http://127.0.0.1:3001';
  
  constructor(private http: HttpClient) {}

  getAlerts(filters?: {
    sensorTypes?: string[];
    industries?: string[];
    eventTypes?: string[];
    resolutionReasons?: string[];
    deviceTypes?: string[];
    countries?: string[];
    continents?: string[];
    startDate?: string;
    endDate?: string;
  }): Observable<AlertsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.sensorTypes && filters.sensorTypes.length) {
        filters.sensorTypes.forEach(type => {
          params = params.append('sensor_types', type);
        });
      }
      
      if (filters.industries && filters.industries.length) {
        filters.industries.forEach(industry => {
          params = params.append('industries', industry);
        });
      }
      
      if (filters.eventTypes && filters.eventTypes.length) {
        filters.eventTypes.forEach(type => {
          params = params.append('event_types', type);
        });
      }
      
      if (filters.resolutionReasons && filters.resolutionReasons.length) {
        filters.resolutionReasons.forEach(reason => {
          params = params.append('resolution_reasons', reason);
        });
      }
      
      if (filters.deviceTypes && filters.deviceTypes.length) {
        filters.deviceTypes.forEach(type => {
          params = params.append('device_types', type);
        });
      }
      
      if (filters.countries && filters.countries.length) {
        filters.countries.forEach(country => {
          params = params.append('countries', country);
        });
      }
      
      if (filters.continents && filters.continents.length) {
        filters.continents.forEach(continent => {
          params = params.append('continents', continent);
        });
      }
      
      if (filters.startDate) {
        params = params.set('start_date', filters.startDate);
      }
      
      if (filters.endDate) {
        params = params.set('end_date', filters.endDate);
      }
    }
    
    return this.http.get<AlertsResponse>(`${this.apiBaseUrl}/alerts`, { params });
  }
}