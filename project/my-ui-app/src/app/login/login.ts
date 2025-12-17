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
    // Constructor: dependencies are injected here
    // - `AuthService` provides `login()` which calls backend API
    // - `Router` is used to navigate to other routes (e.g. /register, /dashboard)
    console.log('LoginComponent loaded');
  }

  // Navigate to register page
  goToRegister(): void {
    // Called when user clicks "Create New Account" or "Register here"
    // We log for debugging, then use the router to navigate to the '/register' route.
    // Make sure you have a route defined for '/register' that points to your register component.
    console.log('🔵 Navigating to register page...');
    this.router.navigate(['/register']);
  }

  // when pressing the login button, so it can authenticate the user and main Logic Section 
  onSubmit(): void {
    // --- FORM SUBMIT FLOW ---
    // 1) Clear previous error messages and ensure loader is stopped on validation errors.
    console.log('=== Form Submitted ===');
    this.errorMessage = '';
    this.isLoading = false; // Ensure loader is reset if we bail early

    // 2) Basic client-side validation
    if (!this.email) {
      // If email is empty, set an error and stop
      this.errorMessage = 'Email is required';
      return;
    }

    // Simple regex to ensure basic email structure
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

    // 3) All client validation passed — show loader and call AuthService
    this.isLoading = true;

    // AuthService.login returns an Observable (HTTP call). We subscribe to handle responses.
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        // Successful login: stop loader, persist basic session info and navigate.
        console.log('Login successful!', response);
        this.isLoading = false;

        // Persist that the user is logged in and their role (used elsewhere in app)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify(response.user));
        localStorage.setItem('role', response.role);

        // Decide destination based on role. Currently both point to '/dashboard'.
        // Update this if you have different landing pages for different roles.
        if (response.role === 'admin') {
          // Admin landing page
          this.router.navigate(['/dashboard']);
        } else {
          // Regular user landing page (currently same path)
          this.router.navigate(['/dashboard']);
        }

        // Optional user feedback
        alert('Login successful!');
      },
      error: (error: any) => {
        // On error: stop loader and show a helpful message if available
        this.isLoading = false;
        this.errorMessage =
          error.error?.non_field_errors?.[0] ||
          'Login failed. Please check your credentials.';
      },
    });

  }
}
