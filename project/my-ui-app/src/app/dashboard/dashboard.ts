import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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

  searchText: string = '';
  isLoadingUsers: boolean = true;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  // Role
  role: string = 'user';
  isAdmin: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
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

  // Assignment Modal
  showAssignModal: boolean = false;

  allProcesses: any[] = [];
  allSubprocesses: any[] = [];
  allObjectives: any[] = [];

  selectedProcessIds: number[] = [];
  selectedSubprocessIds: number[] = [];
  selectedObjectiveIds: number[] = [];

  processSearch: string = "";
  subprocessSearch: string = "";
  objectiveSearch: string = "";

  filteredProcesses: any[] = [];
  filteredSubprocesses: any[] = [];
  filteredObjectives: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const storedRole = localStorage.getItem('role');
    const userData = localStorage.getItem("user");

    if (userData) {
      this.loggedInUserId = JSON.parse(userData).id;
    }

    this.role = storedRole ? storedRole : 'user';
    this.isAdmin = this.role === 'admin';

    // Load all main data
    this.loadUsers();
    this.loadProcesses();
    this.loadSubprocesses();
    this.loadObjectives();  // REQUIRED for objectives to show
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ----------- USERS -------------
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.http.get('http://127.0.0.1:8000/api/auth/users/').subscribe({
      next: (res: any) => {
        this.users = res;
        this.filteredUsers = [...res];
        this.isLoadingUsers = false;
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoadingUsers = false;
        alert('Failed to load users');
      }
    });
  }

  // ----------- PROCESSES -------------
  loadProcesses(): void {
    this.http.get('http://127.0.0.1:8000/api/auth/process/list/').subscribe({
      next: (res: any) => {
        this.allProcesses = res;
      },
      error: (err) => console.error('Error loading processes:', err)
    });
  }

  // ----------- SUBPROCESSES -------------
  loadSubprocesses(): void {
    this.http.get('http://127.0.0.1:8000/api/auth/subprocess/list/').subscribe({
      next: (res: any) => {
        this.allSubprocesses = res;
      },
      error: (err) => console.error('Error loading subprocesses:', err)
    });
  }

  // ❗❗❗ THIS WAS MISSING → FIX OBJECTIVE NOT SHOWING
  loadObjectives(): void {
  this.http.get('http://127.0.0.1:8000/api/auth/objective/list/').subscribe({
    next: (res: any) => {
      this.allObjectives = res.data;   // <-- FIX HERE
      console.log("Loaded Objectives:", this.allObjectives);
    },
    error: (err) => console.error('Error loading objectives:', err)
  });
}


  // ----------- SEARCH USERS -------------
  filterUsers(): void {
    const txt = this.searchText.toLowerCase().trim();

    if (!txt) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter((u) => {
        return (
          (u.first_name || '').toLowerCase().includes(txt) ||
          (u.last_name || '').toLowerCase().includes(txt) ||
          (u.username || '').toLowerCase().includes(txt) ||
          (u.email || '').toLowerCase().includes(txt) ||
          (u.phone || '').toString().includes(txt) ||
          (u.status || '').toLowerCase().includes(txt) ||
          (u.role || '').toLowerCase().includes(txt)
        );
      });
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  // ----------- PAGINATION -------------
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, end);
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

  // ----------- EDIT USER MODAL -------------
  openEditModal(user: any): void {
    if (!this.isAdmin) return;

    this.selectedUser = user;
    this.showEditModal = true;

    this.editForm = {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      status: user.status || 'inactive',
      role: user.role || 'user',
      password: '',
      confirmPassword: ''
    };
  }

  closeModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;

    this.editForm = {
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
  }

  updateUser(): void {
    if (!this.selectedUser) return;

    if (this.editForm.password !== this.editForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const payload: any = {
      first_name: this.editForm.first_name,
      last_name: this.editForm.last_name,
      username: this.editForm.username,
      email: this.editForm.email,
      phone: this.editForm.phone,
      status: this.editForm.status,
      role: this.editForm.role
    };

    if (this.editForm.password.trim() !== '') {
      payload.password = this.editForm.password;
      payload.password_confirm = this.editForm.confirmPassword;
    }

    this.http
      .put(
        `http://127.0.0.1:8000/api/auth/users/${this.selectedUser.id}/update/`,
        payload
      )
      .subscribe({
        next: () => {
          alert('User updated successfully');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Failed to update user');
        }
      });
  }

  deleteUser(id: number) {
    if (!this.isAdmin) return;

    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (loggedInUser.id === id) {
      alert("You cannot delete yourself.");
      return;
    }

    if (!confirm("Are you sure?")) return;

    this.http.delete(`http://127.0.0.1:8000/api/auth/users/${id}/delete/`).subscribe({
      next: () => {
        alert("User deleted");
        this.loadUsers();
      },
      error: () => alert("Delete failed")
    });
  }

  toggleStatus(user: any): void {
    if (!this.isAdmin) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    this.http
      .patch(
        `http://127.0.0.1:8000/api/auth/users/${user.id}/toggle-status/`,
        { status: newStatus }
      )
      .subscribe({
        next: () => { user.status = newStatus; },
        error: () => alert('Failed to change status')
      });
  }

  changeRole(user: any, event: any) {
    if (!this.isAdmin) return;

    const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (loggedInUser.id === user.id) {
      alert("You cannot change your own role.");
      event.target.value = user.role;
      return;
    }

    const newRole = event.target.value;

    this.http.patch(`http://127.0.0.1:8000/api/auth/users/${user.id}/role/`, {
      role: newRole
    }).subscribe({
      next: () => {
        user.role = newRole;
        alert("Role updated successfully!");
      },
      error: () => alert("Failed to update role")
    });
  }

  // ---------------- ASSIGN MODAL ----------------------

  openAssignModal(user: any): void {
    if (!this.isAdmin) return;

    this.selectedUser = user;
    this.showAssignModal = true;

    // Load existing assignments
    this.selectedProcessIds = user.assigned_processes || [];
    this.selectedSubprocessIds = user.assigned_subprocesses || [];
    this.selectedObjectiveIds = user.assigned_objectives || [];

    // Initialize filtered lists
    this.filteredProcesses = [...this.allProcesses];

    this.filterSubprocesses();
    this.filterObjectives();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedUser = null;

    this.selectedProcessIds = [];
    this.selectedSubprocessIds = [];
    this.selectedObjectiveIds = [];

    this.filteredProcesses = [];
    this.filteredSubprocesses = [];
    this.filteredObjectives = [];

    this.processSearch = "";
    this.subprocessSearch = "";
    this.objectiveSearch = "";
  }

  // Checks
  isProcessAssigned(id: number): boolean {
    return this.selectedProcessIds.includes(id);
  }

  isSubprocessAssigned(id: number): boolean {
    return this.selectedSubprocessIds.includes(id);
  }

  isObjectiveAssigned(id: number): boolean {
    return this.selectedObjectiveIds.includes(id);
  }

  // TOGGLE PROCESS
  toggleProcess(id: number): void {
    const index = this.selectedProcessIds.indexOf(id);

    if (index > -1) {
      this.selectedProcessIds.splice(index, 1);
    } else {
      this.selectedProcessIds.push(id);
    }

    this.filterSubprocesses();
  }

  // PROCESS SEARCH
  filterProcesses(): void {
    const term = this.processSearch.toLowerCase().trim();

    if (!term) {
      this.filteredProcesses = [...this.allProcesses];
    } else {
      this.filteredProcesses = this.allProcesses.filter(p =>
        p.process_name.toLowerCase().includes(term)
      );
    }
  }

  // SUBPROCESSES FILTER
  filterSubprocesses(): void {
    const selected = new Set(this.selectedProcessIds);

    let baseList = this.allSubprocesses.filter(sp =>
      selected.has(sp.process_id)
    );

    if (this.subprocessSearch.trim()) {
      const term = this.subprocessSearch.toLowerCase();
      baseList = baseList.filter(sp =>
        sp.subprocess_name.toLowerCase().includes(term)
      );
    }

    this.filteredSubprocesses = baseList;
  }

  // SEARCH SUBPROCESS
  filterSubprocessSearch(): void {
    this.filterSubprocesses();
    this.filterObjectives();
  }

  // FILTER OBJECTIVES
  filterObjectives(): void {
    const selectedSub = new Set(this.selectedSubprocessIds);

    let baseList = this.allObjectives.filter(obj =>
      selectedSub.has(obj.subprocess_id)
    );

    if (this.objectiveSearch.trim()) {
      const term = this.objectiveSearch.toLowerCase();
      baseList = baseList.filter(obj =>
        obj.objective_name.toLowerCase().includes(term)
      );
    }

    this.filteredObjectives = baseList;
  }

  filterObjectiveSearch(): void {
    this.filterObjectives();
  }

  // TOGGLE SUBPROCESS
  toggleSubprocess(id: number): void {
    const index = this.selectedSubprocessIds.indexOf(id);

    if (index > -1) {
      this.selectedSubprocessIds.splice(index, 1);
    } else {
      this.selectedSubprocessIds.push(id);
    }

    this.filterObjectives();
  }

  // TOGGLE OBJECTIVE
  toggleObjective(id: number): void {
    const index = this.selectedObjectiveIds.indexOf(id);

    if (index > -1) {
      this.selectedObjectiveIds.splice(index, 1);
    } else {
      this.selectedObjectiveIds.push(id);
    }
  }

  // SAVE ASSIGNMENTS
  saveAssignments(): void {
    if (!this.selectedUser) return;

    const payload = {
      process_ids: this.selectedProcessIds,
      subprocess_ids: this.selectedSubprocessIds,
      objective_ids: this.selectedObjectiveIds
    };

    this.http.post(
      `http://127.0.0.1:8000/api/auth/users/${this.selectedUser.id}/assign/`,
      payload
    )
    .subscribe({
      next: () => {
        alert("Assignments saved successfully!");
        this.closeAssignModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error("Assignment error:", err);
        alert("Failed to save assignments");
      }
    });
  }
}
