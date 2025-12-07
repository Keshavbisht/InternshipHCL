import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-assigned',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assigned.html',
  styleUrls: ['./assigned.css']
})
export class AssignedComponent implements OnInit {

  assignedData: {
    process_name: string;
    subprocesses: { name: string; link: string | null }[];
  }[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadAssignedData();
  }

  loadAssignedData(): void {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id;

    if (!userId) return;

    this.http.get(`http://127.0.0.1:8000/api/auth/users/${userId}/assignments/`)
      .subscribe({
        next: (res: any) => {
          
          // Backend response structure:
          // {
          //   "data": [
          //     {
          //       "process_name": "FINANCE",
          //       "subprocesses": [
          //          { "name": "Cash", "link": "https://..." }
          //       ]
          //     }
          //   ]
          // }

          this.assignedData = res.data || [];
        },
        error: (err) => {
          console.error(err);
          alert("Failed to load assigned processes.");
        }
      });
  }

  openLink(link: string | null) {
    if (link) {
      window.open(link, "_blank");
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

}
