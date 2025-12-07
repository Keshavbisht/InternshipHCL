import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  
  isAdmin: boolean = false;
  currentRoute: string = '';
  menuItems: any[] = [];
  userId: number | null = null;

  constructor(private router: Router, private http: HttpClient) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  ngOnInit(): void {
    const storedRole = localStorage.getItem('role');
    const userData = localStorage.getItem('user');
    
    this.isAdmin = storedRole === 'admin';
    this.currentRoute = this.router.url;
    
    if (userData) {
      const user = JSON.parse(userData);
      this.userId = user.id;
    }

    this.buildMenu();
  }

  buildMenu(): void {
    if (this.isAdmin) {
      // Admin sees all processes
      this.menuItems = [
        { label: 'Home', icon: '🏠', route: '/dashboard' },
        { label: 'Process Master', icon: '📋', route: '/process' },
        { label: 'SubProcess Master', icon: '🔧', route: '/subprocess' }
      ];
    } else {
      // Regular user - load only assigned processes
      this.menuItems = [
        { label: 'Home', icon: '🏠', route: '/dashboard' }
      ];

      // Load user's assigned processes from backend
      if (this.userId) {
        this.loadUserAssignments();
      }
    }
  }

  loadUserAssignments(): void {
    this.http
      .get(`http://127.0.0.1:8000/api/auth/users/${this.userId}/assignments/`)
      .subscribe({
        next: (data: any) => {
          // Add assigned processes to menu
          data.assigned_processes.forEach((process: any) => {
            this.menuItems.push({
              label: process.process_name,
              icon: '📋',
              route: `/process/${process.process_id}`, // Or wherever process details are shown
              isProcess: true
            });
          });

          // Add assigned subprocesses to menu
          data.assigned_subprocesses.forEach((subprocess: any) => {
            this.menuItems.push({
              label: subprocess.subprocess_name,
              icon: '🔧',
              route: `/subprocess/${subprocess.subprocess_id}`, // Or wherever subprocess details are shown
              isSubprocess: true
            });
          });
        },
        error: (err) => {
          console.error('Error loading assignments:', err);
        }
      });
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}