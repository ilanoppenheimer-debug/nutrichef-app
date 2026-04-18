/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const navState = vi.hoisted(() => ({
  pathname: '/cook',
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push }),
}));

vi.mock('next/link', () => ({
  default: function LinkMock({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

const logout = vi.fn().mockResolvedValue(undefined);
const authState = vi.hoisted(() => ({
  user: null as {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null,
  isLocalMode: false,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: authState.user,
    isLocalMode: authState.isLocalMode,
    logout,
    loginWithGoogle: vi.fn(),
    continueLocally: vi.fn(),
    linkToGoogle: vi.fn(),
  }),
}));

const askConfirmation = vi.fn();
vi.mock('@/context/ConfirmDialogContext', () => ({
  useConfirmDialog: () => ({ askConfirmation }),
}));

import { ROUTES } from '@/lib/routes.js';
import Navbar from './Navbar.jsx';

describe('Navbar', () => {
  beforeEach(() => {
    navState.pathname = ROUTES.cook;
    authState.user = null;
    authState.isLocalMode = false;
    push.mockClear();
    logout.mockClear();
    askConfirmation.mockReset();
  });

  it('renderiza marca y enlaces principales al cook, plan y guardados', () => {
    render(<Navbar />);

    expect(screen.getByRole('heading', { name: /NutriChef IA/i })).toBeTruthy();

    const cookLinks = screen.getAllByRole('link', { name: /Cocinar/i });
    expect(cookLinks.some((l) => l.getAttribute('href') === ROUTES.cook)).toBe(true);
    const planLinks = screen.getAllByRole('link', { name: /Plan/i });
    expect(planLinks.some((l) => l.getAttribute('href') === ROUTES.plan)).toBe(true);
    const savedLinks = screen.getAllByRole('link', { name: /Guardados/i });
    expect(savedLinks.some((l) => l.getAttribute('href') === ROUTES.saved)).toBe(true);
  });

  it('marca aria-current en la ruta activa', () => {
    navState.pathname = ROUTES.plan;
    render(<Navbar />);

    const planLinks = screen.getAllByRole('link', { name: /Plan/i });
    expect(planLinks.every((l) => l.getAttribute('aria-current') === 'page')).toBe(true);
    const cocinar = screen.getAllByRole('link', { name: /Cocinar/i });
    expect(cocinar.every((el) => !el.hasAttribute('aria-current'))).toBe(true);
  });

  it('abre el menú de usuario, navega a perfil y cierra al hacer clic fuera', async () => {
    const user = userEvent.setup();
    authState.user = { displayName: 'Ana', email: 'ana@test.com' };
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    expect(screen.getByText('Ana')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Mi Perfil/i }));
    expect(push).toHaveBeenCalledWith(ROUTES.profile);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    await user.click(screen.getByRole('button', { name: /Configuración/i }));
    expect(push).toHaveBeenCalledWith(ROUTES.settings);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Mi Perfil')).toBeNull();
    });
  });

  it('pide confirmación y llama logout al cerrar sesión', async () => {
    const user = userEvent.setup();
    askConfirmation.mockResolvedValue(true);
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
  });

  it('no llama logout si el usuario cancela el diálogo', async () => {
    const user = userEvent.setup();
    askConfirmation.mockResolvedValue(false);
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: /Menú de usuario/i }));
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    await new Promise((r) => setTimeout(r, 40));
    expect(logout).not.toHaveBeenCalled();
  });
});
