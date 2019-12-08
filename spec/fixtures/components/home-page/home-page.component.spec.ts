import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { ActivatedRoute, ParamMap, Router, RouterEvent } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;
  let fakeRouter: jasmine.SpyObj<Router>;
  let routerEventsSubject: ReplaySubject<RouterEvent>;
  let fakeRoute: jasmine.SpyObj<ActivatedRoute>;
  let routeParams: { [prop: string]: string };
  let routeParamMap: jasmine.SpyObj<ParamMap>;
  let routeParamsSubject: ReplaySubject<ParamMap>;

  beforeEach(async(() => {
    fakeRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerEventsSubject = new ReplaySubject<RouterEvent>(1);
    fakeRoute = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', []);
    routeParams = {};
    routeParamMap = jasmine.createSpyObj<ParamMap>('ParamMap', ['get', 'has']);
    routeParamMap.get.and.callFake((k) => routeParams[k]);
    routeParamMap.has.and.callFake((k) => !!routeParams[k]);
    routeParamsSubject = (fakeRoute as { paramMap: Observable<ParamMap> }).paramMap = new ReplaySubject<ParamMap>(1);

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
