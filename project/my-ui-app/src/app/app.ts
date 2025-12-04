import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [RouterOutlet]
})
export class AppComponent {
  title = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.listenToRouteChanges();
  }

  listenToRouteChanges() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute.firstChild;
          while (route?.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route?.data ?? [])
      )
      .subscribe(data => {
        this.title = data['title'] || 'My App'; // fallback title
      });
  }
}
