import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlaygroundPage } from './playground';

describe('PlaygroundPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlaygroundPage],
      providers: [provideRouter([])],
    });
  });

  it('deve criar e expor o título da página', () => {
    const fixture = TestBed.createComponent(PlaygroundPage);
    expect(fixture.componentInstance.titulo).toBe('Playground');
  });
});
