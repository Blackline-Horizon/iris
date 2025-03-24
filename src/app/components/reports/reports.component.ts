import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GenerateReportModalComponent } from './generate-report-modal.component';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import blacklineSafetyInfoJSON from '../../../assets/data/blackline-safety-info.json';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, CommonModule, GenerateReportModalComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reports: any[] = [];
  newReport: any = { id: 0, name: '', start_date: '', end_date: '', region: '', industry: '', location: '', alerts: [] };
  isModalVisible = false;

  // This holds the URL for the currently displayed PDF in the iframe
  selectedPdfUrl: SafeResourceUrl | null = null;
  // This holds the pdf_id of the currently selected report
  selectedPdfId: number | null = null;

  industries: string[] = blacklineSafetyInfoJSON.industries;
  alerts: string[] = blacklineSafetyInfoJSON.sensorTypes;
  devices: string[] = blacklineSafetyInfoJSON.deviceTypes;
  resolutions: string[] = blacklineSafetyInfoJSON.resolutionTypes;
  events: string[] = blacklineSafetyInfoJSON.eventTypes;
  continents: string[] = blacklineSafetyInfoJSON.continents;
  
  constructor(
    private apiService: ApiService,
    private stateService: StateService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  /**
   * Load all reports from the API and, if available, 
   * automatically display the first report's PDF.
   */
  loadReports(): void {
    const params = { username: this.stateService.getState("username") };
    this.apiService.getHermes("reports", params)
      .then(response => {
        // Sort by descending ID (newest first)
        this.reports = response.data.sort((r1: any, r2: any) => r2.id - r1.id);

        // If there's at least one report, display its PDF by default
        if (this.reports.length > 0) {
          this.openPdf(this.reports[0].pdf_id);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }

  /**
   * Show the "Create Report" modal
   */
  showModal(): void {
    this.isModalVisible = true;
  }
  
  /**
   * Hide the "Create Report" modal
   */
  hideModal(): void {
    this.isModalVisible = false;
  }

  /**
   * Delete a report by ID
   */
  deleteReport(id: number): void {
    const params = { report_id: id };
    this.apiService.deleteHermes("report", params)
      .then(() => {
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
      });
  }

  /**
   * Load and display the PDF for a given pdf_id
   */
  openPdf(pdfId: number): void {
    // Mark this pdf_id as the currently selected
    this.selectedPdfId = pdfId;

    const params = { pdf_id: pdfId };
    this.apiService.getHermes("pdf_report", params)
      .then(response => {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        // Sanitize the URL for safe binding in an iframe
        this.selectedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      })
      .catch(err => {
        console.error(err);
      });
  }
}
