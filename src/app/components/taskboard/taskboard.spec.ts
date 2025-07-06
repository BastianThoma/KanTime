import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Taskboard } from './taskboard';

describe('Taskboard', () => {
  let component: Taskboard;
  let fixture: ComponentFixture<Taskboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Taskboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Taskboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
