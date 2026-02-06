import { useState, useCallback, FormEvent } from 'react';
import { z, ZodError } from 'zod';

interface FormOptions<T> {
  initialValues: T;
  schema: z.ZodType<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface FormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: unknown) => void;
  resetForm: () => void;
  validateField: (field: keyof T) => boolean;
}

export function useForm<T>(options: FormOptions<T>): FormReturn<T> {
  const { initialValues, schema, onSubmit } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: keyof T): boolean => {
      try {
        const fieldSchema = schema.shape[field];
        if (fieldSchema) {
          fieldSchema.parse(values[field]);
          setErrors((prev) => ({ ...prev, [field]: undefined }));
          return true;
        }
        return true;
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldError = error.errors.find((e) => e.path[0] === field);
          if (fieldError) {
            setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
            return false;
          }
        }
        return true;
      }
    },
    [schema, values]
  );

  const validateAll = useCallback((): boolean => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof T;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        return false;
      }
      return true;
    }
  }, [schema, values]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = e.target instanceof HTMLInputElement ? e.target.checked : undefined;

      const fieldValue = type === 'checkbox' ? checked : value;

      setValues((prev) => ({ ...prev, [name]: fieldValue }));

      // Clear error when user starts typing
      if (errors[name as keyof T]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name as keyof T);
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Mark all fields as touched
      const allTouched: Partial<Record<keyof T, boolean>> = {};
      (Object.keys(values) as Array<keyof T>).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate all fields
      const isValid = validateAll();
      if (!isValid) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll, onSubmit]
  );

  const setFieldValue = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
    validateField,
  };
}

export default useForm;
