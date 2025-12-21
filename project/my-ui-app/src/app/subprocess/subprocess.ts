import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-subprocess',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subprocess.html',
  styleUrls: ['./subprocess.css']
})
export class Subprocess {

  apiBase = "https://internshiphcl-production.up.railway.app/api/auth";


  processes: any[] = [];
  subprocesses: any[] = [];

  selectedProcess: number | null = null;  // process_id
  subprocessName: string = '';
  subprocessLink: string = '';            // ⭐ NEW FIELD
  status: boolean = true;

  editingId: number | null = null;

  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProcesses();
    this.loadSubProcesses();
  }

  // 🔹 LOAD PROCESSES
  loadProcesses() {
    this.http.get(`${this.apiBase}/process/list/`).subscribe({
      next: (res: any) => {
        this.processes = res;
      },
      error: () => {
        this.errorMessage = "Failed to load processes.";
      }
    });
  }

  // 🔹 LOAD SUBPROCESSES
  loadSubProcesses() {
    this.http.get(`${this.apiBase}/subprocess/list/`).subscribe({
      next: (res: any) => {
        this.subprocesses = res;
      },
      error: () => {
        this.errorMessage = "Failed to load subprocess data.";
      }
    });
  }

  // 🔹 CREATE / UPDATE SUBPROCESS
  saveSubProcess() {
    if (!this.selectedProcess) {
      this.errorMessage = "Please select a Process.";
      return;
    }

    const body = {
      process_id: this.selectedProcess,
      subprocess_name: this.subprocessName,
      link: this.subprocessLink,              // ⭐ SEND LINK TO BACKEND
      status: this.status ? "active" : "inactive"
    };

    if (this.editingId) {
      // UPDATE
      this.http.put(`${this.apiBase}/subprocess/${this.editingId}/update/`, body)
        .subscribe({
          next: () => {
            this.successMessage = "SubProcess updated successfully!";
            this.loadSubProcesses();
            this.clearForm();
          }
        });

    } else {
      // CREATE
      this.http.post(`${this.apiBase}/subprocess/create/`, body)
        .subscribe({
          next: () => {
            this.successMessage = "SubProcess created successfully!";
            this.loadSubProcesses();
            this.clearForm();
          }
        });
    }
  }

  // 🔹 EDIT SUBPROCESS (load into form)
  editSubProcess(item: any) {
    this.editingId = item.subprocess_id;
    this.selectedProcess = item.process_id;
    this.subprocessName = item.subprocess_name;
    this.subprocessLink = item.link || "";            // ⭐ LOAD LINK FOR EDIT
    this.status = item.status === "active";
  }

  // 🔹 DELETE SUBPROCESS
  deleteSubProcess(id: number) {
    if (!confirm("Are you sure you want to delete this SubProcess?")) return;

    this.http.delete(`${this.apiBase}/subprocess/${id}/delete/`)
      .subscribe({
        next: () => {
          this.successMessage = "SubProcess deleted!";
          this.loadSubProcesses();
        }
      });
  }

  // 🔹 RESET FORM
  clearForm() {
    this.editingId = null;
    this.selectedProcess = null;
    this.subprocessName = '';
    this.subprocessLink = '';               // ⭐ CLEAR LINK
    this.status = true;

    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2000);
  }

}
