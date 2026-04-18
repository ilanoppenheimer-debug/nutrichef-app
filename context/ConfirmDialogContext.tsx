'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import BaseDialog from '@/components/base/BaseDialog';
import BaseButton from '@/components/base/BaseButton';

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type DialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: ((value: boolean) => void) | null;
};

type ConfirmDialogContextValue = {
  askConfirmation: (options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

const initialState: DialogState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  danger: false,
  resolve: null,
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>(initialState);

  const askConfirmation = useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        open: true,
        title: options?.title || 'Confirmar acción',
        description: options?.description || '',
        confirmLabel: options?.confirmLabel || 'Confirmar',
        cancelLabel: options?.cancelLabel || 'Cancelar',
        danger: Boolean(options?.danger),
        resolve,
      });
    });
  }, []);

  const closeWith = useCallback((value: boolean) => {
    setDialogState((current) => {
      current.resolve?.(value);
      return { ...current, open: false, resolve: null };
    });
  }, []);

  const contextValue = useMemo<ConfirmDialogContextValue>(
    () => ({ askConfirmation }),
    [askConfirmation],
  );

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <BaseDialog
        open={dialogState.open}
        title={dialogState.title}
        description={dialogState.description}
        onClose={() => closeWith(false)}
        actions={
          <>
            <BaseButton variant="secondary" onClick={() => closeWith(false)}>
              {dialogState.cancelLabel}
            </BaseButton>
            <BaseButton
              variant={dialogState.danger ? 'danger' : 'primary'}
              onClick={() => closeWith(true)}
            >
              {dialogState.confirmLabel}
            </BaseButton>
          </>
        }
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): ConfirmDialogContextValue {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog debe usarse dentro de ConfirmDialogProvider');
  }
  return context;
}
