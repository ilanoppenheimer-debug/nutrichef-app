/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Footer from './Footer.jsx';

describe('Footer', () => {
  it('muestra marca y leyenda', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toContain('NutriChef IA');
    expect(footer.textContent).toContain('Hecho para planificar y cocinar mejor');
  });
});
