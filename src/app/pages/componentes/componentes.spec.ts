import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComponentesPage } from './componentes';

describe('ComponentesPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ComponentesPage],
      providers: [provideRouter([])],
    });
  });

  it('deve criar e expor o título da página', () => {
    const fixture = TestBed.createComponent(ComponentesPage);
    expect(fixture.componentInstance.titulo).toBe('Componentes');
  });
});
