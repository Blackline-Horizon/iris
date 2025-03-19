import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
// import { jsPDF } from 'jspdf';
import { CommonModule } from '@angular/common';
import { GenerateReportModalComponent } from './generate-report-modal.component';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import blacklineSafetyInfoJSON from '../../../assets/data/blackline-safety-info.json'

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, CommonModule, GenerateReportModalComponent], // Add FormsModule here
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  reports: any[]= [];
  newReport: any = { id: 0, name: '', start_date: '', end_date: '', region: '', industry:'', location:'', alerts: [] };
  isModalVisible=false;
  industries: string[] = blacklineSafetyInfoJSON.industries;
  alerts: string[] = blacklineSafetyInfoJSON.sensorTypes;
  devices: string[] = blacklineSafetyInfoJSON.deviceTypes;
  resolutions: string[] = blacklineSafetyInfoJSON.resolutionTypes;
  events: string[] = blacklineSafetyInfoJSON.eventTypes;
  continents: string[] = blacklineSafetyInfoJSON.continents;
  
  constructor(private apiService: ApiService, private stateService: StateService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    // api call to hermes
    let params = {username:this.stateService.getState("username")};
    this.apiService.getHermes("reports", params).then(response=>{
      this.reports= response.data;
    }).catch(err=>{
      console.log(err);
    })
  }

  showModal() {
    this.isModalVisible = true;
    }
  
    hideModal() {
    this.isModalVisible = false;
    }

  deleteReport(id: number): void {
    let params = {report_id:id};
    this.apiService.deleteHermes("report", params).then(response=>{
      window.location.reload();
    })
  }

  openPdf(pdfId: number): void {
    let params = {pdf_id:pdfId};
    this.apiService.getHermes("pdf_report", params).then(response=>{
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');  // Opens in new tab
    })
  }

}