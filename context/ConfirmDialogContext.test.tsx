/** @vitest-environment jsdom */
import { useState } from 'react';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConfirmDialogProvider, useConfirmDialog } from './ConfirmDialogContext';

describe('useConfirmDialog', () => {
  it('lanza fuera de ConfirmDialogProvider', () => {
    expect(() => renderHook(() => useConfirmDialog())).toThrow(
      'useConfirmDialog debe usarse dentro de ConfirmDialogProvider',
    );
  });
});

function DialogHarness() {
  const { askConfirmation } = useConfirmDialog();
  const [ultimo, setUltimo] = useState<string>('—');

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const ok = await askConfirmation({
            title: 'Título de prueba',
            description: 'Descripción opcional',
            confirmLabel: 'Aceptar',
            cancelLabel: 'Volver',
          });
          setUltimo(ok ? 'si' : 'no');
        }}
      >
        abrir-dialogo
      </button>
      <span>{`resultado:${ultimo}`}</span>
    </div>
  );
}

describe('ConfirmDialogProvider', () => {
  it('resuelve true al confirmar y false al cancelar', async () => {
    render(
      <ConfirmDialogProvider>
        <DialogHarness />
      </ConfirmDialogProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /abrir-dialogo/i }));
    expect(await screen.findByRole('heading', { name: /Título de prueba/i })).toBeTruthy();
    expect(screen.getByText('Descripción opcional')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /^Aceptar$/i }));
    await waitFor(() => {
      expect(screen.getByText('resultado:si')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /abrir-dialogo/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Volver$/i }));
    await waitFor(() => {
      expect(screen.getByText('resultado:no')).toBeTruthy();
    });
  });

  it('cierra con false al usar el botón cerrar del diálogo', async () => {
    render(
      <ConfirmDialogProvider>
        <DialogHarness />
      </ConfirmDialogProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /abrir-dialogo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar diálogo/i }));
    await waitFor(() => {
      expect(screen.getByText('resultado:no')).toBeTruthy();
    });
  });
});
