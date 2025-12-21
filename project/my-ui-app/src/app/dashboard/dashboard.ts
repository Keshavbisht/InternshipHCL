import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

const API_BASE = 'https://internshiphcl-production.up.railway.app/api/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];

  loggedInUserId: number | null = null;
  loggedInUserName: string = '';

  searchText = '';
  isLoadingUsers = true;

  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  role = 'user';
  isAdmin = false;

  showEditModal = false;
  selectedUser: any = null;

  editForm = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    status: '',
    role: '',
    password: '',
    confirmPassword: ''
  };

  showAssignModal = false;

  allProcesses: any[] = [];
  allSubprocesses: any[] = [];
  allObjectives: any[] = [];

  selectedProcessIds: number[] = [];
  selectedSubprocessIds: number[] = [];
  selectedObjectiveIds: number[] = [];

  processSearch = '';
  subprocessSearch = '';
  objectiveSearch = '';

  filteredProcesses: any[] = [];
  filteredSubprocesses: any[] = [];
  filteredObjectives: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (userData) {
      const user = JSON.parse(userData);
      this.loggedInUserId = user.id;
      this.loggedInUserName = `${user.first_name} ${user.last_name}`;
    }

    this.role = storedRole || 'user';
    this.isAdmin = this.role === 'admin';

    this.loadUsers();
    this.loadProcesses();
    this.loadSubprocesses();
    this.loadObjectives();
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ---------------- USERS ----------------
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.http.get(`${API_BASE}/users/`).subscribe({
      next: (res: any) => {
        this.users = res;
        this.filteredUsers = [...res];
        this.isLoadingUsers = false;
        this.updatePagination();
      },
      error: () => {
        this.isLoadingUsers = false;
        alert('Failed to load users');
      }
    });
  }

  // ---------------- PROCESS ----------------
  loadProcesses(): void {
    this.http.get(`${API_BASE}/process/list/`).subscribe({
      next: (res: any) => this.allProcesses = res
    });
  }

  // ---------------- SUBPROCESS ----------------
  loadSubprocesses(): void {
    this.http.get(`${API_BASE}/subprocess/list/`).subscribe({
      next: (res: any) => this.allSubprocesses = res
    });
  }

  // ---------------- OBJECTIVE ----------------
  // ---------------- OBJECTIVE ----------------
loadObjectives(): void {
  this.http.get(`${API_BASE}/objective/list/`).subscribe({
    next: (res: any) => {
      this.allObjectives = res.data || [];
    },
    error: (err) => {
      console.error('Error loading objectives:', err);
    }
  });
}


  // ---------------- SEARCH ----------------
  filterUsers(): void {
    const txt = this.searchText.toLowerCase().trim();

    this.filteredUsers = !txt
      ? [...this.users]
      : this.users.filter(u =>
          (u.first_name || '').toLowerCase().includes(txt) ||
          (u.last_name || '').toLowerCase().includes(txt) ||
          (u.username || '').toLowerCase().includes(txt) ||
          (u.email || '').toLowerCase().includes(txt) ||
          (u.status || '').toLowerCase().includes(txt) ||
          (u.role || '').toLowerCase().includes(txt)
        );

    this.currentPage = 1;
    this.updatePagination();
  }


  // ---------------- PAGINATION ----------------
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(p: number): void {
    this.currentPage = p;
    this.updatePagination();
  }

  // ---------------- EDIT USER ----------------
  openEditModal(user: any): void {
    if (!this.isAdmin) return;
    this.selectedUser = user;
    this.showEditModal = true;
    this.editForm = { ...user, password: '', confirmPassword: '' };
  }

  closeModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  updateUser(): void {
    if (!this.selectedUser) return;

    if (this.editForm.password !== this.editForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const payload: any = { ...this.editForm };
    delete payload.confirmPassword;

    if (!payload.password) delete payload.password;

    this.http.put(
      `${API_BASE}/users/${this.selectedUser.id}/update/`,
      payload
    ).subscribe({
      next: () => {
        alert('User updated');
        this.closeModal();
        this.loadUsers();
      },
      error: () => alert('Update failed')
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Delete user?')) return;

    this.http.delete(`${API_BASE}/users/${id}/delete/`).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Delete failed')
    });
  }

  toggleStatus(user: any): void {
    this.http.patch(
      `${API_BASE}/users/${user.id}/toggle-status/`,
      { status: user.status === 'active' ? 'inactive' : 'active' }
    ).subscribe(() => user.status = user.status === 'active' ? 'inactive' : 'active');
  }

  changeRole(user: any, role: string): void {
    this.http.patch(
      `${API_BASE}/users/${user.id}/role/`,
      { role }
    ).subscribe(() => user.role = role);
  }

  // ---------------- ASSIGN ----------------
  openAssignModal(user: any): void {
    this.selectedUser = user;
    this.showAssignModal = true;
    this.selectedProcessIds = user.assigned_processes || [];
    this.selectedSubprocessIds = user.assigned_subprocesses || [];
    this.selectedObjectiveIds = user.assigned_objectives || [];
    this.filterSubprocesses();
    this.filterObjectives();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedUser = null;
  }

  toggleProcess(id: number): void {
    this.toggle(id, this.selectedProcessIds);
    this.filterSubprocesses();
  }

  toggleSubprocess(id: number): void {
    this.toggle(id, this.selectedSubprocessIds);
    this.filterObjectives();
  }

  toggleObjective(id: number): void {
    this.toggle(id, this.selectedObjectiveIds);
  }

  toggle(id: number, list: number[]): void {
    const i = list.indexOf(id);
    i > -1 ? list.splice(i, 1) : list.push(id);
  }

  filterSubprocesses(): void {
    this.filteredSubprocesses = this.allSubprocesses.filter(
      sp => this.selectedProcessIds.includes(sp.process_id)
    );
  }

  filterObjectives(): void {
    this.filteredObjectives = this.allObjectives.filter(
      o => this.selectedSubprocessIds.includes(o.subprocess_id)
    );
  }

  saveAssignments(): void {
    if (!this.selectedUser) return;

    this.http.post(
      `${API_BASE}/users/${this.selectedUser.id}/assign/`,
      {
        process_ids: this.selectedProcessIds,
        subprocess_ids: this.selectedSubprocessIds,
        objective_ids: this.selectedObjectiveIds
      }
    ).subscribe({
      next: () => {
        alert('Assignments saved');
        this.closeAssignModal();
        this.loadUsers();
      },
      error: () => alert('Assignment failed')
    });
  }
}

