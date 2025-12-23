/**
 * useToggle Hook - Nexus Framework
 * Hook para gerenciamento de estados booleanos
 */

import { useState, useCallback } from 'react';

/**
 * Hook para controlar estados booleanos de forma simplificada
 *
 * @param {boolean} initialValue - Valor inicial (default: false)
 * @returns {[boolean, Object]} - [valor, { toggle, setTrue, setFalse, setValue }]
 */
const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);

  // Alternar valor
  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  // Definir como true
  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  // Definir como false
  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  // Reset para valor inicial
  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return [
    value,
    {
      toggle,
      setTrue,
      setFalse,
      setValue,
      reset
    }
  ];
};

export default useToggle;
export { useToggle };
