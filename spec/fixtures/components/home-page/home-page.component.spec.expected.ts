import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { ActivatedRoute, ParamMap, Router, RouterEvent } from '@angular/router';
import { ReplaySubject } from 'rxjs';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let fakeRouter: jasmine.SpyObj<Router>;
  let routerEvents: ReplaySubject<RouterEvent>;
  let fakeRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async(() => {
    fakeRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerEvents = new ReplaySubject<RouterEvent>(1);
    fakeRoute = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', []);

    TestBed.configureTestingModule({
      declarations: [HomePageComponent],
      providers: [
        { provide: Router, useFactory: () => fakeRouter },
        { provide: ActivatedRoute, useFactory: () => fakeRoute },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
