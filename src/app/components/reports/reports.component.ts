import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
// import { jsPDF } from 'jspdf';
import { CommonModule } from '@angular/common';
import { GenerateReportModalComponent } from './generate-report-modal.component';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import blacklineSafetyInfoJSON from '../../../assets/data/blackline-safety-info.json'

interface Report {
  id: number;
  name: string;
  date: string;
  author: string;
  region: string;
  industry: string;
  location: string;
  alerts: string[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, CommonModule, GenerateReportModalComponent], // Add FormsModule here
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  reports: any[]= [];
  newReport: Omit<Report, 'id'> = { name: '', date: '', author: '', region: '', industry:'', location:'', alerts: [] };
  isModalVisible=false;
  industries: string[] = blacklineSafetyInfoJSON.industries;
  alerts: string[] = blacklineSafetyInfoJSON.sensorTypes;
  
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
    this.reports = this.reports.filter(report => report.id !== id);
  }

  openPdf(reportId: number): void {
    console.log(reportId);
    const pdfUrl = `../assets/sample-report${reportId}.pdf`; // Path to your PDF file
    window.open(pdfUrl, '_blank'); // Open PDF in a new tab
  }

}