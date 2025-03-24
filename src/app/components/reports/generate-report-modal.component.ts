import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output,Input } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
@Component({
  selector: 'app-generate-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generate-report-modal.component.html',
  styleUrl: './generate-report-modal.component.css'
})
export class GenerateReportModalComponent {
  @Input() industries: string[] = []; // Receive the industries array
  @Input() alerts: string[] = [];
  @Input() devices:string[] = [];
  @Input() resolutions:string[] = [];
  @Input() events:string[] = [];
  @Input() continents:string[] = [];
  
  @Output() close = new EventEmitter<void>();
  constructor(private apiService: ApiService, private stateService: StateService){}

  newReport: any = {
    username:"",
    title:"",
    date_start:"",
    date_end: "",
    industry:"",
    continents:[],
    alerts:[],
    devices:[],
    resolutions:[],
    events:[]
  }

  closeModal(): void {
    this.close.emit();
  }

  ngOnInit(): void{
    this.newReport['username'] = this.stateService.getState("username");
  }

  hasNonEmptyValues(obj: Record<string, any>): boolean {
    // Check if the input is an object
    if (typeof obj !== 'object' || obj === null) {
        return false; // Not a valid object
    }

    // Iterate over each key in the object
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            // Check if the value is an empty string, null, or undefined
            if (value === '' || value === null || value === undefined) {
                return false; // Found an empty field
            }
        }
    }
    return true;
  }

  // Method to handle checkbox change
  onCheckboxChange(field:string, alert: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked; // Cast to HTMLInputElement
    if (isChecked) {
      // If checked, add the alert to the array
      this.newReport[field].push(alert);
    } else {
      // If unchecked, remove the alert from the array
      const index = this.newReport[field].indexOf(alert);
      if (index > -1) {
        this.newReport[field].splice(index, 1);
      }
    }
  }

  createReport(): void {
    console.log(this.newReport);
    if (!this.hasNonEmptyValues(this.newReport)){
      alert("Please populate all fields");
      return;
    }
    // turning industry into a list
    this.newReport['industry'] = [this.newReport != "All" ? this.newReport['industry'] : ""]
    this.apiService.postAsyncHermes("report", this.newReport)
      .catch(err=>{
        throw err;
      })
    this.closeModal();
  }

}
