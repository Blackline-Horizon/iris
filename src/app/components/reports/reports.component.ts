import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { FormsModule } from '@angular/forms'; // Import FormsModule
// import { jsPDF } from 'jspdf';
import { CommonModule } from '@angular/common';
import reportsData from '../../../assets/data/reports.json';
import { GenerateReportModalComponent } from './generate-report-modal.component';
import { MatDialog, MatDialogModule, MatDialogConfig } from '@angular/material/dialog';


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
  imports: [FormsModule, CommonModule, HttpClientModule, MatDialogModule], // Add FormsModule here
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  reports: any[] = reportsData;
  newReport: Omit<Report, 'id'> = { name: '', date: '', author: '', region: '', industry:'', location:'', alerts: [] };

  industries: string[] = [
    'Fire and Hazmat',
    'Oil and Gas',
    'Water and Wastewater',
    'Utilities',
    'Hydrogen Operations',
    'Petrochemical',
    'Renewable Energy',
    'Biotech and Pharma',
    'Steel Manufacturing',
    'Transportation and Logistics'
  ];

  alerts: string[] = [
    'C12',
    'HCN',
    'LEL-MPS',
    'NO2',
    'O3',
    'SO2',
    'C102',
    'CO2',
    'H2S',
    'NH3',
    'O2',
    'VOCs-PID'
  ];
  constructor(private http: HttpClient, public dialog:MatDialog) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    
  }

  openGenerateReportMenu(){

    const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.backdropClass = 'generate-report-modal'
        dialogConfig.data = { createReport: this.createReport.bind(this), ...this.newReport};

    this.dialog.open(GenerateReportModalComponent, dialogConfig);
  }

  deleteReport(id: number): void {
    this.reports = this.reports.filter(report => report.id !== id);
  }

  createReport(): void {
    const newId = this.reports.length ? Math.max(...this.reports.map(r => r.id)) + 1 : 1;
    this.reports.push({ id: newId, ...this.newReport });
    this.newReport = { name: '', date: '', author: '', region: '', industry:'', location:'', alerts: [] }; // Reset form
  }

  openPdf(reportId: number): void {
    const pdfUrl = 'assets/sample-report.pdf'; // Path to your PDF file
    window.open(pdfUrl, '_blank'); // Open PDF in a new tab
  }

  generatePdf(): void {
    // const doc = new jsPDF();

    // // Add title
    // doc.setFontSize(20);
    // doc.text('Previous Reports', 10, 10);

    // // Add table headers
    // doc.setFontSize(12);
    // doc.text('Name', 10, 20);
    // doc.text('Date', 80, 20);
    // doc.text('Author', 150, 20);

    // // Add table rows
    // let y = 30; // Starting y position for table rows
    // this.reports.forEach(report => {
    //   doc.text(report.name, 10, y);
    //   doc.text(report.date, 80, y);
    //   doc.text(report.author, 150, y);
    //   y += 10; // Move down for the next row
    // });

    // // Save the PDF
    // doc.save('previous_reports.pdf');
  }
}