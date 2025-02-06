import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';


@Component({
  selector: 'app-generate-report-modal',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, FormsModule],
  templateUrl: './generate-report-modal.component.html',
  styleUrl: './generate-report-modal.component.css'
})
export class GenerateReportModalComponent {
  constructor(private dialogRef: MatDialogRef<GenerateReportModalComponent>, @Inject(MAT_DIALOG_DATA) public newReport: any) {}

  close(): void {
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.close();
  }

  createReport(): void {
    if (this.newReport.createReport) {
      this.newReport.createReport(); // Call the method from the parent
    }
  }

}
