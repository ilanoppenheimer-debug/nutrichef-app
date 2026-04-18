/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TipsWidget from './TipsWidget';

describe('TipsWidget', () => {
  it('abre el panel al pulsar el botón flotante y muestra el tip del día', () => {
    render(<TipsWidget />);

    fireEvent.click(screen.getByRole('button', { name: /Abrir tips de cocina/i }));

    expect(screen.getByText('💡 Tips de Cocina')).toBeTruthy();
    expect(screen.getByText(/Tip del día — cambia mañana/)).toBeTruthy();
  });

  it('cambia a la pestaña Técnicas y muestra la descripción del tip diario', () => {
    render(<TipsWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Abrir tips de cocina/i }));

    fireEvent.click(screen.getByRole('button', { name: /Técnicas/i }));

    expect(screen.getByText('Juliana')).toBeTruthy();
    expect(document.body.textContent).toMatch(
      /Corte en tiras finas|Cubo pequeño|Hojas apiladas|Sellar la superficie|mise en place|blanquear/i,
    );
  });

  it('muestra sustituciones y equivalencias en Medidas', () => {
    render(<TipsWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Abrir tips de cocina/i }));

    fireEvent.click(screen.getByRole('button', { name: /Sustituciones/i }));
    expect(document.body.textContent).toMatch(/semillas de chía|chía.*agua/i);

    fireEvent.click(screen.getByRole('button', { name: /Medidas/i }));
    expect(screen.getByText('Volumen')).toBeTruthy();
    expect(screen.getByText('1 taza = 240 ml')).toBeTruthy();
  });

  it('cierra con el botón X del encabezado y al hacer clic fuera del panel', () => {
    render(<TipsWidget />);
    fireEvent.click(screen.getByRole('button', { name: /Abrir tips de cocina/i }));

    const header = screen.getByText('💡 Tips de Cocina').closest('div');
    expect(header).toBeTruthy();
    fireEvent.click(within(header as HTMLElement).getByRole('button'));
    expect(screen.queryByText('💡 Tips de Cocina')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Abrir tips de cocina/i }));
    expect(screen.getByText('💡 Tips de Cocina')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('💡 Tips de Cocina')).toBeNull();
  });
});
