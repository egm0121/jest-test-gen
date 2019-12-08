import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { take, filter } from 'rxjs/operators';

@Component({
  selector: 'app-name',
  template: ``,
  styles: [``]
})
export class HomePageComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const value = this.route.snapshot.queryParams['value'];
    console.info(value);

    this.route.paramMap.subscribe(params => {
      if (params.has('type') && params.get('type') === 'user') {
        this.router.navigate(['home', 'user']);
      }
    });

    this.router.events
      .pipe(
        take(1),
        filter(ev => ev instanceof NavigationStart)
      )
      .subscribe(()=>{
        console.info('nav start event')
      });
  }
}
