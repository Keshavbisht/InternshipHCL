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

  // processSearch: string = "";
  // subprocessSearch: string = "";


  // pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  // role & auth
  role: string = 'user';
  isAdmin: boolean = false;

  // edit modal
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

  // 👇 NEW: Assignment modal
  showAssignModal: boolean = false;
  allProcesses: any[] = [];
  allSubprocesses: any[] = [];
  selectedProcessIds: number[] = [];
  selectedSubprocessIds: number[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const storedRole = localStorage.getItem('role');
    const userData = localStorage.getItem("user");
    if (userData) {
      this.loggedInUserId = JSON.parse(userData).id;
    }
    this.role = storedRole ? storedRole : 'user';
    this.isAdmin = this.role === 'admin';

    this.loadUsers();
    this.loadProcesses();
    this.loadSubprocesses();
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // --------- LOAD USERS ---------
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

  // --------- LOAD PROCESSES ---------
  loadProcesses(): void {
    this.http.get('http://127.0.0.1:8000/api/auth/process/list/').subscribe({
      next: (res: any) => {
        this.allProcesses = res;
      },
      error: (err) => console.error('Error loading processes:', err)
    });
  }

  // --------- LOAD SUBPROCESSES ---------
  loadSubprocesses(): void {
    this.http.get('http://127.0.0.1:8000/api/auth/subprocess/list/').subscribe({
      next: (res: any) => {
        this.allSubprocesses = res;
      },
      error: (err) => console.error('Error loading subprocesses:', err)
    });
  }

  // --------- SEARCH ---------
  filterUsers(): void {
    const txt = this.searchText.toLowerCase().trim();

    if (!txt) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter((u) => {
        const firstName = (u.first_name || '').toLowerCase();
        const lastName = (u.last_name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toString();
        const status = (u.status || '').toLowerCase();
        const role = (u.role || '').toLowerCase();

        return (
          firstName.includes(txt) ||
          lastName.includes(txt) ||
          username.includes(txt) ||
          email.includes(txt) ||
          phone.includes(txt) ||
          status.includes(txt) ||
          role.includes(txt)
        );
      });
    }

    this.currentPage = 1;
    this.updatePagination();
  }

  // --------- PAGINATION ---------
  updatePagination(): void {
    this.totalPages =
      Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;

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

  // --------- OPEN EDIT MODAL ---------
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

  // --------- CLOSE MODAL ---------
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

  // --------- UPDATE USER (SAVE IN MODAL) ---------
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

  // --------- DELETE USER ---------
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

  // --------- TOGGLE STATUS (Active / Inactive) ---------
  toggleStatus(user: any): void {
    if (!this.isAdmin) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    this.http
      .patch(
        `http://127.0.0.1:8000/api/auth/users/${user.id}/toggle-status/`,
        { status: newStatus }
      )
      .subscribe({
        next: () => {
          user.status = newStatus;
        },
        error: (err) => {
          console.error('Status toggle error:', err);
          alert('Failed to change status');
        }
      });
  }

  // --------- CHANGE ROLE FROM TABLE DROPDOWN ---------
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

  // ========== NEW: ASSIGNMENT FUNCTIONS ==========

// SEARCH FIELDS
processSearch: string = "";
subprocessSearch: string = "";

// FILTERED LISTS
filteredProcesses: any[] = [];
filteredSubprocesses: any[] = [];

// --------- OPEN ASSIGN MODAL ---------
openAssignModal(user: any): void {
  if (!this.isAdmin) return;

  this.selectedUser = user;
  this.showAssignModal = true;

  // Load existing assignments
  this.selectedProcessIds = user.assigned_processes || [];
  this.selectedSubprocessIds = user.assigned_subprocesses || [];

  // Initialize filtered lists
  this.filteredProcesses = [...this.allProcesses];

  this.filterSubprocesses(); // Filter subprocesses based on processes
}

// --------- CLOSE ASSIGN MODAL ---------
closeAssignModal(): void {
  this.showAssignModal = false;
  this.selectedUser = null;

  this.selectedProcessIds = [];
  this.selectedSubprocessIds = [];
  this.filteredProcesses = [];
  this.filteredSubprocesses = [];

  this.processSearch = "";
  this.subprocessSearch = "";
}

// --------- CHECK IF PROCESS IS ASSIGNED ---------
isProcessAssigned(processId: number): boolean {
  return this.selectedProcessIds.includes(processId);
}

// --------- CHECK IF SUBPROCESS IS ASSIGNED ---------
isSubprocessAssigned(subprocessId: number): boolean {
  return this.selectedSubprocessIds.includes(subprocessId);
}

// --------- TOGGLE PROCESS SELECTION ---------
toggleProcess(processId: number): void {
  const index = this.selectedProcessIds.indexOf(processId);

  if (index > -1) {
    this.selectedProcessIds.splice(index, 1);
  } else {
    this.selectedProcessIds.push(processId);
  }

  this.filterSubprocesses();
}

// --------- FILTER PROCESSES (SEARCH) ---------
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

// --------- FILTER SUBPROCESSES (BY PROCESS + SEARCH) ---------
filterSubprocesses(): void {
  const selected = new Set(this.selectedProcessIds);

  // Base filtered by process selection
  let baseList = this.allSubprocesses.filter(sp =>
    selected.has(sp.process_id)
  );

  // Apply search filter if typed
  if (this.subprocessSearch.trim()) {
    const term = this.subprocessSearch.toLowerCase();
    baseList = baseList.filter(sp =>
      sp.subprocess_name.toLowerCase().includes(term)
    );
  }

  this.filteredSubprocesses = baseList;
}

// --------- SUBPROCESS SEARCH ONLY ---------
filterSubprocessSearch(): void {
  this.filterSubprocesses();
}

// --------- TOGGLE SUBPROCESS SELECTION ---------
toggleSubprocess(subprocessId: number): void {
  const index = this.selectedSubprocessIds.indexOf(subprocessId);

  if (index > -1) {
    this.selectedSubprocessIds.splice(index, 1);
  } else {
    this.selectedSubprocessIds.push(subprocessId);
  }
}

// --------- SAVE ASSIGNMENTS ---------
saveAssignments(): void {
  if (!this.selectedUser) return;

  const payload = {
    process_ids: this.selectedProcessIds,
    subprocess_ids: this.selectedSubprocessIds
  };

  this.http
    .post(
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