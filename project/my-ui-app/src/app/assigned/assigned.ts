import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assigned',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assigned.html',
  styleUrls: ['./assigned.css']
})
export class AssignedComponent implements OnInit {

  // Original data from backend
  assignedData: any[] = [];

  // Flattened rows for table
  flatData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // Search
  searchText: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAssignedData();
  }

  // ---------------- LOAD DATA ----------------
  loadAssignedData(): void {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const userId = user.id;

    if (!userId) return;

    this.http
      .get(`https://internshiphcl-production.up.railway.app/api/auth/users/${userId}/assignments/`)
      .subscribe({
        next: (res: any) => {
          this.assignedData = res.data || [];
          this.flattenData();
          this.filteredData = [...this.flatData];
          this.updatePagination();
        },
        error: () => alert('Failed to load assigned SOP')
      });
  }

  // ---------------- FLATTEN DATA FOR TABLE ----------------
  flattenData(): void {
    this.flatData = [];

    for (const p of this.assignedData) {
      for (const obj of p.objectives) {
        this.flatData.push({
          process_name: p.process_name,
          subprocess_name: obj.subprocess_name,
          objective_name: obj.objective_name,
          documents: obj.links.documents || [],
          videos: obj.links.videos || [],
          images: obj.links.images || []
        });
      }
    }
  }

  // ---------------- SEARCH ----------------
  filterData(): void {
    const term = this.searchText.toLowerCase().trim();

    if (!term) {
      this.filteredData = [...this.flatData];
    } else {
      this.filteredData = this.flatData.filter(row =>
        row.process_name.toLowerCase().includes(term) ||
        row.subprocess_name.toLowerCase().includes(term) ||
        row.objective_name.toLowerCase().includes(term)
      );
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  // ---------------- PAGINATION ----------------
  updatePagination(): void {
    this.totalPages =
      Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    this.paginatedData = this.filteredData.slice(start, end);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }
}
