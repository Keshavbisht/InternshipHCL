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
    // Admin sees all modules
    this.menuItems = [
      { label: 'Home', icon: '🏠', route: '/dashboard' },
      { label: 'Process Master', icon: '📋', route: '/process' },
      { label: 'SubProcess Master', icon: '🔧', route: '/subprocess' },
      { label: 'Objective Master', icon: '🎯', route: '/objective' },
      { label: 'Assigned', icon: '📌', route: '/assigned' }
    ];
  } else {
    // USER sees only Home + Assigned
    this.menuItems = [
      { label: 'Home', icon: '🏠', route: '/dashboard' },
      { label: 'Assigned', icon: '📌', route: '/assigned' }
    ];
  }
}


  loadUserAssignments(): void {
  this.http
    .get(`http://127.0.0.1:8000/api/auth/users/${this.userId}/assignments/`)
    .subscribe({
      next: (res: any) => {

        let assignedList = res.data || [];

        assignedList.forEach((item: any) => {
          // Add PROCESS to sidebar
          this.menuItems.push({
            label: item.process_name,
            icon: '📋',
            route: '/assigned', 
            isProcess: true
          });

          // Add EACH SUBPROCESS as separate item
          item.subprocess_names.forEach((sub: string) => {
            this.menuItems.push({
              label: sub,
              icon: '🔧',
              route: '/assigned',
              isSubprocess: true
            });
          });
        });

      },
      error: (err) => console.error('Error loading assignments:', err)
    });
}


  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}