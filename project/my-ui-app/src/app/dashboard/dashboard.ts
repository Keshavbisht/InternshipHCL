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
    event.target.value = user.role;  // reset dropdown
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

}
