import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';
import { AuthService } from '../auth.service';
import { EventBusService } from '../helpers/event-bus.service';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let fakeAuthService: jasmine.SpyObj<AuthService>;
  let fakeEventBusService: jasmine.SpyObj<EventBusService>;
  let fakeDocument: jasmine.SpyObj<Document>;

  beforeEach(async(() => {
    fakeAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    fakeEventBusService = jasmine.createSpyObj<EventBusService>('EventBusService', ['of']);
    fakeDocument = jasmine.createSpyObj<Document>('Document', ['querySelectorAll']);

    TestBed.configureTestingModule({
      declarations: [LoginFormComponent],
      providers: [
        { provide: AuthService, useFactory: () => fakeAuthService },
        { provide: EventBusService, useFactory: () => fakeEventBusService },
        { provide: Document, useFactory: () => fakeDocument },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
