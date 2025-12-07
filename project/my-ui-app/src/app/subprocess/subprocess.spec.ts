import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subprocess } from './subprocess';

describe('Subprocess', () => {
  let component: Subprocess;
  let fixture: ComponentFixture<Subprocess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subprocess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Subprocess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
