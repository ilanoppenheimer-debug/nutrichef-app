'use client';

import { useCallback, useState, type KeyboardEvent } from 'react';

export function useRestrictionInput(addRestriction: (value: string) => void) {
  const [restrictionInput, setRestrictionInput] = useState('');

  const handleAddRestriction = useCallback(() => {
    if (!restrictionInput.trim()) return;
    addRestriction(restrictionInput);
    setRestrictionInput('');
  }, [addRestriction, restrictionInput]);

  const onRestrictionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddRestriction();
      }
    },
    [handleAddRestriction],
  );

  return {
    restrictionInput,
    setRestrictionInput,
    handleAddRestriction,
    onRestrictionKeyDown,
  };
}
