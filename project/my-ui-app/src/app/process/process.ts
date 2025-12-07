import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process.html',
  styleUrls: ['./process.css']
})
export class Process {

  // API BASE URL (MATCHES YOUR DJANGO URLS)
  apiBase = "http://127.0.0.1:8000/api/auth/process";

  processes: any[] = [];

  processName: string = '';
  status: boolean = true;     // true = active checkbox
  editingId: number | null = null;

  // UI messages
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProcesses();
  }

  // 🔹 LOAD ALL PROCESSES
  loadProcesses() {
    this.http.get(`${this.apiBase}/list/`)
      .subscribe({
        next: (res: any) => {
          this.processes = res;
        },
        error: (err) => {
          this.errorMessage = "Failed to load processes";
          console.error(err);
        }
      });
  }

  // 🔹 CREATE / UPDATE PROCESS
  saveProcess() {
    const body = {
      process_name: this.processName,
      status: this.status ? "active" : "inactive"
    };

    // UPDATE
    if (this.editingId) {
      this.http.put(`${this.apiBase}/${this.editingId}/update/`, body)
        .subscribe({
          next: () => {
            this.successMessage = "Process updated successfully!";
            this.errorMessage = "";
            this.loadProcesses();
            this.clearForm();
          },
          error: () => {
            this.errorMessage = "Failed to update process";
          }
        });

    } else {
      // CREATE
      this.http.post(`${this.apiBase}/create/`, body)
        .subscribe({
          next: () => {
            this.successMessage = "Process created successfully!";
            this.errorMessage = "";
            this.loadProcesses();
            this.clearForm();
          },
          error: () => {
            this.errorMessage = "Failed to create process";
          }
        });
    }
  }

  // 🔹 EDIT BUTTON CLICK
  editProcess(p: any) {
    this.editingId = p.process_id;
    this.processName = p.process_name;
    this.status = (p.status === "active");
  }

  // 🔹 DELETE PROCESS
  deleteProcess(id: number) {
    if (!confirm("Are you sure you want to delete this process?")) return;

    this.http.delete(`${this.apiBase}/${id}/delete/`)
      .subscribe({
        next: () => {
          this.successMessage = "Process deleted!";
          this.loadProcesses();
        },
        error: () => {
          this.errorMessage = "Failed to delete process.";
        }
      });
  }

  // 🔹 RESET FORM
  clearForm() {
    this.editingId = null;
    this.processName = '';
    this.status = true;

    // Clear messages after 2 seconds
    setTimeout(() => {
      this.successMessage = "";
      this.errorMessage = "";
    }, 2000);
  }
}
