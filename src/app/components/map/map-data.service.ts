import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface EventRecord {
  id: number;
  device_event_id: number;
  device_event_type_id: number;
  device_date_created: string;
  date_created: string;
  name: string;
  assigned_user?: string;       
  resolution_reason: string;
  gas_type?: string;             
  current_status: string;
  user_id: number;
  organization_id: number;
  device_id: number;
  date_acknowledged?: string;
  acknowledge_user_id?: number;  
  date_resolved?: string;
  resolve_user_id?: number;     
  date_last_updated?: string;
  uuid?: string;
  lat?: number;                   
  lng?: number;                 
}

export interface EventType {
  id: number;
  name: string;
  description: string;
  is_visible: number;
  is_high_alert: number;
}


@Injectable({
  providedIn: 'root'
})
export class MapDataService {
  private jsonUrl = "http://127.0.0.1:3001/events"
  // private jsonUrl = 'assets/data/map-data.json';

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<any> {
    return this.http.get<any>(this.jsonUrl);
  }
}
