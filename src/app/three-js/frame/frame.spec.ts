import { TestBed } from '@angular/core/testing';

import { Frame } from './frame';

describe('Frame', () => {
  let service: Frame;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Frame);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
