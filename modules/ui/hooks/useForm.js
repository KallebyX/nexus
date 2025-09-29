/**
 * Form Hook - Nexus Framework
 * Hook para gerenciamento de formulários com validação
 */

import { useState, useCallback } from 'react';
import { isFunction, isObject, isEmpty } from '../../../utils/types.js';

export const useForm = (initialValues = {}, validationSchema = {}, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false
  } = options;

  // Estados do formulário
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validar um campo específico
  const validateField = useCallback((name, value) => {
    const fieldSchema = validationSchema[name];
    if (!fieldSchema) return null;

    // Se é uma função de validação
    if (isFunction(fieldSchema)) {
      return fieldSchema(value, values);
    }

    // Se é um objeto com regras
    if (isObject(fieldSchema)) {
      const { required, min, max, pattern, custom } = fieldSchema;

      // Campo obrigatório
      if (required && (value === undefined || value === null || value === '')) {
        return fieldSchema.message || 'Este campo é obrigatório';
      }

      // Valor mínimo/comprimento mínimo
      if (min !== undefined) {
        if (typeof value === 'string' && value.length < min) {
          return fieldSchema.message || `Mínimo de ${min} caracteres`;
        }
        if (typeof value === 'number' && value < min) {
          return fieldSchema.message || `Valor mínimo: ${min}`;
        }
      }

      // Valor máximo/comprimento máximo
      if (max !== undefined) {
        if (typeof value === 'string' && value.length > max) {
          return fieldSchema.message || `Máximo de ${max} caracteres`;
        }
        if (typeof value === 'number' && value > max) {
          return fieldSchema.message || `Valor máximo: ${max}`;
        }
      }

      // Padrão regex
      if (pattern && typeof value === 'string' && !pattern.test(value)) {
        return fieldSchema.message || 'Formato inválido';
      }

      // Validação customizada
      if (custom && isFunction(custom)) {
        return custom(value, values);
      }
    }

    return null;
  }, [validationSchema, values]);

  // Validar todos os campos
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values, validateField]);

  // Alterar valor de um campo
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Validar se necessário
    if (validateOnChange && touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateOnChange, touched, validateField]);

  // Handler de mudança
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);

  // Handler de blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validar se necessário
    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateOnBlur, validateField, values]);

  // Resetar formulário
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Handler de submit
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Marcar todos os campos como touched
      const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validar formulário
      const isValid = validateForm();

      if (isValid) {
        try {
          await onSubmit(values);
          if (resetOnSubmit) {
            reset();
          }
        } catch (error) {
          console.error('Erro no submit:', error);
        }
      }

      setIsSubmitting(false);
    };
  }, [values, validateForm, resetOnSubmit, reset, validationSchema]);

  // Estado derivado
  const isValid = isEmpty(errors);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    // Valores e estados
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,

    // Métodos
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validateForm,
    validateField,

    // Helpers para campos específicos
    getFieldProps: (name) => ({
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : ''
    })
  };
};