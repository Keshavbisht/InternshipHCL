import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Assigned } from './assigned';

describe('Assigned', () => {
  let component: Assigned;
  let fixture: ComponentFixture<Assigned>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Assigned]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Assigned);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
