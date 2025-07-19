/**
 * Custom hooks for form validation using Zod schemas
 */

import { useCallback, useState } from 'react';
import { z } from 'zod';
import { monitor } from '../core/monitoring';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}

/**
 * Hook for validating data against a Zod schema
 */
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(
    (data: unknown): ValidationResult<T> => {
      setIsValidating(true);
      setErrors([]);

      try {
        const validatedData = schema.parse(data);
        setIsValidating(false);
        
        monitor.debug('Validation successful', {
          module: 'useValidation',
          schemaName: (schema as any)._def?.typeName || 'unknown'
        });

        return {
          isValid: true,
          data: validatedData,
          errors: [],
        };
      } catch (error) {
        let validationErrors: ValidationError[] = [];

        if (error instanceof z.ZodError) {
          validationErrors = error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          }));
        } else {
          validationErrors = [
            {
              field: 'unknown',
              message: 'An unknown validation error occurred',
            },
          ];
        }

        setErrors(validationErrors);
        setIsValidating(false);

        monitor.debug('Validation failed', {
          module: 'useValidation',
          schemaName: (schema as any)._def?.typeName || 'unknown',
          errorCount: validationErrors.length,
        });

        return {
          isValid: false,
          errors: validationErrors,
        };
      }
    },
    [schema]
  );

  const validateAsync = useCallback(
    async (data: unknown): Promise<ValidationResult<T>> => {
      setIsValidating(true);
      setErrors([]);

      try {
        const validatedData = await schema.parseAsync(data);
        setIsValidating(false);

        return {
          isValid: true,
          data: validatedData,
          errors: [],
        };
      } catch (error) {
        let validationErrors: ValidationError[] = [];

        if (error instanceof z.ZodError) {
          validationErrors = error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          }));
        } else {
          validationErrors = [
            {
              field: 'unknown',
              message: 'An unknown validation error occurred',
            },
          ];
        }

        setErrors(validationErrors);
        setIsValidating(false);

        return {
          isValid: false,
          errors: validationErrors,
        };
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getFieldError = useCallback(
    (fieldPath: string): string | undefined => {
      const error = errors.find((err) => err.field === fieldPath);
      return error?.message;
    },
    [errors]
  );

  return {
    validate,
    validateAsync,
    errors,
    isValidating,
    clearErrors,
    getFieldError,
    hasErrors: errors.length > 0,
  };
}

/**
 * Hook for validating forms with multiple fields
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) {
  const { validate, validateAsync, errors, isValidating, clearErrors, getFieldError } = useValidation(schema);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const touchField = useCallback((fieldName: string) => {
    setTouched((prev) => new Set(prev).add(fieldName));
  }, []);

  const touchAllFields = useCallback((data: Partial<T>) => {
    setTouched(new Set(Object.keys(data)));
  }, []);

  const resetForm = useCallback(() => {
    setTouched(new Set());
    clearErrors();
  }, [clearErrors]);

  const validateField = useCallback(
    (fieldName: keyof T, value: any, formData: Partial<T>): boolean => {
      touchField(fieldName as string);
      
      // Create a partial schema for just this field
      try {
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          return true;
        }
      } catch {
        // Field validation failed, but we'll catch it in full form validation
      }
      
      // Validate the entire form to get proper error context
      const result = validate({ ...formData, [fieldName]: value });
      return result.isValid;
    },
    [schema, validate, touchField]
  );

  const shouldShowFieldError = useCallback(
    (fieldName: string): boolean => {
      return touched.has(fieldName) && !!getFieldError(fieldName);
    },
    [touched, getFieldError]
  );

  return {
    validate,
    validateAsync,
    validateField,
    errors,
    isValidating,
    clearErrors,
    getFieldError,
    hasErrors: errors.length > 0,
    touched,
    touchField,
    touchAllFields,
    resetForm,
    shouldShowFieldError,
  };
}

/**
 * Utility function to safely parse data with a schema
 */
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { success: false, errors };
    }
    
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Unknown validation error' }],
    };
  }
}