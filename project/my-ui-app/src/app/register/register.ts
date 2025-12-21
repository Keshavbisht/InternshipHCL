import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {

  // ✅ SINGLE SOURCE OF TRUTH (PRODUCTION API)
  private apiUrl = 'https://internshiphcl-production.up.railway.app/api/auth';

  form = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };

  users: any[] = [];
  filteredUsers: any[] = [];
  paginatedUsers: any[] = [];

  searchText = '';
  errorMessage = '';
  successMessage = '';

  isLoading = false;
  isLoadingUsers = true;

  isEditMode = false;
  editingUserId: number | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;

  constructor(private http: HttpClient, public router: Router) {}

  ngOnInit() {
    this.loadUsers();
  }

  // ================= LOAD USERS =================
  loadUsers() {
    this.isLoadingUsers = true;

    this.http.get(`${this.apiUrl}/users/`).subscribe({
      next: (res: any) => {
        this.users = res;
        this.filteredUsers = [...res];
        this.isLoadingUsers = false;
        this.updatePagination();
      },
      error: () => {
        this.errorMessage = 'Failed to load users';
        this.isLoadingUsers = false;
      }
    });
  }

  // ================= SEARCH =================
  filterUsers() {
    const text = this.searchText.toLowerCase().trim();

    this.filteredUsers = !text
      ? [...this.users]
      : this.users.filter((u) =>
          (u.first_name || '').toLowerCase().includes(text) ||
          (u.last_name || '').toLowerCase().includes(text) ||
          (u.username || '').toLowerCase().includes(text) ||
          (u.email || '').toLowerCase().includes(text) ||
          (u.phone || '').includes(text) ||
          (u.status || '').toLowerCase().includes(text)
        );

    this.currentPage = 1;
    this.updatePagination();
  }

  // ================= PAGINATION =================
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, end);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  get pageNumbers() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ================= EDIT =================
  editUser(user: any) {
    this.isEditMode = true;
    this.editingUserId = user.id;

    this.form = {
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: '',
      confirmPassword: ''
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingUserId = null;
    this.resetForm();
  }

  // ================= DELETE =================
  deleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.http.delete(`${this.apiUrl}/users/${id}/delete/`).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully';
        this.loadUsers();
      },
      error: () => (this.errorMessage = 'Failed to delete user')
    });
  }

  // ================= TOGGLE STATUS =================
  toggleStatus(user: any) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    this.http
      .patch(`${this.apiUrl}/users/${user.id}/toggle-status/`, { status: newStatus })
      .subscribe({
        next: () => {
          user.status = newStatus;
          this.successMessage = `User status updated to ${newStatus}`;
        },
        error: () => (this.errorMessage = 'Failed to update status')
      });
  }

  // ================= SUBMIT =================
  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    const payload = {
      ...this.form,
      password_confirm: this.form.confirmPassword
    };

    this.isLoading = true;

    if (this.isEditMode && this.editingUserId) {
      // UPDATE
      this.http
        .put(`${this.apiUrl}/users/${this.editingUserId}/update/`, payload)
        .subscribe({
          next: () => {
            this.successMessage = 'User updated successfully';
            this.isLoading = false;
            this.cancelEdit();
            this.loadUsers();
          },
          error: () => {
            this.errorMessage = 'Update failed';
            this.isLoading = false;
          }
        });
    } else {
      // CREATE
      this.http.post(`${this.apiUrl}/register/`, payload).subscribe({
        next: () => {
          this.successMessage = 'User registered successfully';
          this.isLoading = false;
          this.resetForm();
          this.loadUsers();
        },
        error: () => {
          this.errorMessage = 'Registration failed';
          this.isLoading = false;
        }
      });
    }
  }

  resetForm() {
    this.form = {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };
  }
}
