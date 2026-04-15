import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import BaseDialog from '../components/base/BaseDialog.jsx';
import BaseButton from '../components/base/BaseButton.jsx';

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    danger: false,
    resolve: null,
  });

  const askConfirmation = useCallback((options) => {
    return new Promise((resolve) => {
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

  const closeWith = useCallback((value) => {
    setDialogState((current) => {
      current.resolve?.(value);
      return { ...current, open: false, resolve: null };
    });
  }, []);

  const contextValue = useMemo(() => ({ askConfirmation }), [askConfirmation]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <BaseDialog
        open={dialogState.open}
        title={dialogState.title}
        description={dialogState.description}
        onClose={() => closeWith(false)}
        actions={(
          <>
            <BaseButton variant="secondary" onClick={() => closeWith(false)}>
              {dialogState.cancelLabel}
            </BaseButton>
            <BaseButton variant={dialogState.danger ? 'danger' : 'primary'} onClick={() => closeWith(true)}>
              {dialogState.confirmLabel}
            </BaseButton>
          </>
        )}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog debe usarse dentro de ConfirmDialogProvider');
  }
  return context;
}
