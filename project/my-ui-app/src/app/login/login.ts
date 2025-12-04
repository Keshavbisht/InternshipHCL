import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('LoginComponent loaded');
  }

  // Navigate to register page
  goToRegister(): void {
    console.log('🔵 Navigating to register page...');
    this.router.navigate(['/register']);
  }

  // when pressing the login button, so it can authenticate the user and main Logic Section 
  onSubmit(): void {
  console.log('=== Form Submitted ===');
  this.errorMessage = '';
  this.isLoading = false; // STOP loader if error happens

  if (!this.email) {
    this.errorMessage = 'Email is required';
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(this.email)) {
    this.errorMessage = '❌ Please enter a valid email (example: abc@gmail.com)';
    return;
  }

  if (!this.password) {
    this.errorMessage = 'Password is required';
    return;
  }

  if (this.password.length < 6) {
    this.errorMessage = 'Password must be at least 6 characters long';
    return;
  }

  // If all validation passed – start API call
  this.isLoading = true;

  this.authService.login(this.email, this.password).subscribe({
    next: (response: any) => {
      console.log('Login successful!', response);
      this.isLoading = false;
      alert('Login successful!');
    },
    error: (error: any) => {
      this.isLoading = false;
      this.errorMessage =
        error.error?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.';
    },
  });

  }
}
