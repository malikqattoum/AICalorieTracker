import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation types
export type ValidationRule = 
  | { required?: boolean; message?: string }
  | { minLength?: number; message?: string }
  | { maxLength?: number; message?: string }
  | { pattern?: RegExp; message?: string }
  | { min?: number; message?: string }
  | { max?: number; message?: string }
  | { validate?: (value: any) => boolean | string; message?: string };

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: FormErrors;
  touched: { [key: string]: boolean };
  isValid: boolean;
  isDirty: boolean;
}

// Common validation messages
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  pattern: (pattern: string) => `Invalid format`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  password: {
    minLength: 'Password must be at least 8 characters',
    uppercase: 'Password must contain at least one uppercase letter',
    lowercase: 'Password must contain at least one lowercase letter',
    number: 'Password must contain at least one number',
    special: 'Password must contain at least one special character',
  },
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
};

// Validation functions
export const validators = {
  required: (value: any, message?: string) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return message || validationMessages.required('This field');
    }
    return true;
  },

  email: (value: string, message?: string) => {
    if (!value) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return message || validationMessages.email;
    }
    return true;
  },

  minLength: (value: string, min: number, message?: string) => {
    if (!value) return true;
    if (value.length < min) {
      return message || validationMessages.minLength(min);
    }
    return true;
  },

  maxLength: (value: string, max: number, message?: string) => {
    if (!value) return true;
    if (value.length > max) {
      return message || validationMessages.maxLength(max);
    }
    return true;
  },

  pattern: (value: string, pattern: RegExp, message?: string) => {
    if (!value) return true;
    if (!pattern.test(value)) {
      return message || validationMessages.pattern('');
    }
    return true;
  },

  min: (value: number, min: number, message?: string) => {
    if (value === null || value === undefined) return true;
    if (value < min) {
      return message || validationMessages.min(min);
    }
    return true;
  },

  max: (value: number, max: number, message?: string) => {
    if (value === null || value === undefined) return true;
    if (value > max) {
      return message || validationMessages.max(max);
    }
    return true;
  },

  phone: (value: string, message?: string) => {
    if (!value) return true;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return message || validationMessages.phone;
    }
    return true;
  },

  url: (value: string, message?: string) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return message || validationMessages.url;
    }
  },

  password: (value: string) => {
    if (!value) return true;
    
    const errors: string[] = [];
    
    if (value.length < 8) {
      errors.push(validationMessages.password.minLength);
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.push(validationMessages.password.uppercase);
    }
    
    if (!/[a-z]/.test(value)) {
      errors.push(validationMessages.password.lowercase);
    }
    
    if (!/[0-9]/.test(value)) {
      errors.push(validationMessages.password.number);
    }
    
    if (!/[^A-Za-z0-9]/.test(value)) {
      errors.push(validationMessages.password.special);
    }
    
    return errors.length === 0 ? true : errors.join(', ');
  },
};

// Hook for form validation
export function useFormValidation(
  initialValues: Record<string, any>,
  schema: ValidationSchema,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
  } = {}
) {
  const [formState, setFormState] = useState<FormState>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
  });

  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
  } = options;

  // Validate a single field
  const validateField = useCallback((name: string, value: any) => {
    const rules = schema[name];
    if (!rules) return true;
    
    const ruleArray = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of ruleArray) {
      // Check each possible rule type
      if ('required' in rule && rule.required) {
        const result = validators.required(value, rule.message);
        if (result !== true) return result;
      }
      
      if ('minLength' in rule && rule.minLength) {
        const result = validators.minLength(value, rule.minLength, rule.message);
        if (result !== true) return result;
      }
      
      if ('maxLength' in rule && rule.maxLength) {
        const result = validators.maxLength(value, rule.maxLength, rule.message);
        if (result !== true) return result;
      }
      
      if ('pattern' in rule && rule.pattern) {
        const result = validators.pattern(value, rule.pattern, rule.message);
        if (result !== true) return result;
      }
      
      if ('min' in rule && rule.min !== undefined) {
        const result = validators.min(value, rule.min, rule.message);
        if (result !== true) return result;
      }
      
      if ('max' in rule && rule.max !== undefined) {
        const result = validators.max(value, rule.max, rule.message);
        if (result !== true) return result;
      }
      
      if ('validate' in rule && rule.validate) {
        const result = rule.validate(value);
        if (result !== true) return rule.message || result;
      }
    }
    
    return true;
  }, [schema]);

  // Validate the entire form
  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    let isValid = true;

    Object.keys(schema).forEach((fieldName) => {
      const value = formState.values[fieldName];
      const result = validateField(fieldName, value);
      
      if (result !== true) {
        errors[fieldName] = result as string;
        isValid = false;
      }
    });

    setFormState(prev => ({
      ...prev,
      errors,
      isValid,
    }));

    return isValid;
  }, [formState.values, schema, validateField]);

  // Handle field change
  const handleChange = useCallback((name: string, value: any) => {
    setFormState(prev => {
      const newValues = { ...prev.values, [name]: value };
      const newTouched = { ...prev.touched, [name]: true };
      let newErrors = { ...prev.errors };
      let isValid = prev.isValid;

      if (validateOnChange) {
        const result = validateField(name, value);
        if (result !== true) {
          newErrors[name] = result as string;
          isValid = false;
        } else {
          delete newErrors[name];
          isValid = Object.keys(newErrors).length === 0;
        }
      }

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        touched: newTouched,
        isValid,
        isDirty: true,
      };
    });
  }, [validateField, validateOnChange]);

  // Handle field blur
  const handleBlur = useCallback((name: string) => {
    setFormState(prev => {
      const newTouched = { ...prev.touched, [name]: true };
      let newErrors = { ...prev.errors };
      let isValid = prev.isValid;

      if (validateOnBlur) {
        const value = prev.values[name];
        const result = validateField(name, value);
        
        if (result !== true) {
          newErrors[name] = result as string;
          isValid = false;
        } else {
          delete newErrors[name];
          isValid = Object.keys(newErrors).length === 0;
        }
      }

      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
        isValid,
      };
    });
  }, [validateField, validateOnBlur]);

  // Handle form submit
  const handleSubmit = useCallback((onSubmit: (values: Record<string, any>) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      if (validateOnSubmit) {
        const isValid = validateForm();
        if (!isValid) return;
      }
      
      onSubmit(formState.values);
    };
  }, [formState.values, validateForm, validateOnSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, [initialValues]);

  // Set form values
  const setValues = useCallback((newValues: Record<string, any>) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, ...newValues },
      isDirty: true,
    }));
  }, []);

  // Set form errors
  const setErrors = useCallback((newErrors: FormErrors) => {
    setFormState(prev => ({
      ...prev,
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0,
    }));
  }, []);

  // Set field error
  const setFieldError = useCallback((name: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      isValid: false,
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((name: string) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[name];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, []);

  return {
    formState,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
    setErrors,
    setFieldError,
    clearFieldError,
    validateForm,
    validateField,
  };
}

// Input field component with validation
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperTextClassName?: string;
}

export function ValidatedInput({
  name,
  label,
  error,
  touched,
  helperText,
  leftIcon,
  rightIcon,
  className,
  labelClassName,
  errorClassName,
  helperTextClassName,
  ...props
}: ValidatedInputProps) {
  const hasError = touched && error;
  const hasSuccess = touched && !error;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name}
          className={cn(
            "block text-sm font-medium text-gray-700 mb-1",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{leftIcon}</span>
          </div>
        )}
        
        <input
          id={name}
          name={name}
          className={cn(
            "block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            hasError && "border-red-300 focus:ring-red-500 focus:border-red-500",
            hasSuccess && "border-green-300 focus:ring-green-500 focus:border-green-500",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {hasError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : hasSuccess ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <span className="text-gray-500 sm:text-sm">{rightIcon}</span>
            )}
          </div>
        )}
      </div>
      
      {hasError && (
        <p className={cn(
          "mt-1 text-sm text-red-600 flex items-center",
          errorClassName
        )}>
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      
      {!hasError && helperText && (
        <p className={cn(
          "mt-1 text-sm text-gray-500",
          helperTextClassName
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// Select field component with validation
interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperTextClassName?: string;
}

export function ValidatedSelect({
  name,
  label,
  error,
  touched,
  helperText,
  options,
  className,
  labelClassName,
  errorClassName,
  helperTextClassName,
  ...props
}: ValidatedSelectProps) {
  const hasError = touched && error;
  const hasSuccess = touched && !error;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name}
          className={cn(
            "block text-sm font-medium text-gray-700 mb-1",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          id={name}
          name={name}
          className={cn(
            "block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            hasError && "border-red-300 focus:ring-red-500 focus:border-red-500",
            hasSuccess && "border-green-300 focus:ring-green-500 focus:border-green-500",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
        
        {hasSuccess && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>
      
      {hasError && (
        <p className={cn(
          "mt-1 text-sm text-red-600 flex items-center",
          errorClassName
        )}>
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      
      {!hasError && helperText && (
        <p className={cn(
          "mt-1 text-sm text-gray-500",
          helperTextClassName
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// Textarea field component with validation
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  helperTextClassName?: string;
}

export function ValidatedTextarea({
  name,
  label,
  error,
  touched,
  helperText,
  className,
  labelClassName,
  errorClassName,
  helperTextClassName,
  ...props
}: ValidatedTextareaProps) {
  const hasError = touched && error;
  const hasSuccess = touched && !error;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={name}
          className={cn(
            "block text-sm font-medium text-gray-700 mb-1",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={name}
          name={name}
          className={cn(
            "block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            hasError && "border-red-300 focus:ring-red-500 focus:border-red-500",
            hasSuccess && "border-green-300 focus:ring-green-500 focus:border-green-500",
            className
          )}
          {...props}
        />
        
        {hasError && (
          <div className="absolute top-2 right-2 flex items-center pointer-events-none">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
        
        {hasSuccess && (
          <div className="absolute top-2 right-2 flex items-center pointer-events-none">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>
      
      {hasError && (
        <p className={cn(
          "mt-1 text-sm text-red-600 flex items-center",
          errorClassName
        )}>
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      
      {!hasError && helperText && (
        <p className={cn(
          "mt-1 text-sm text-gray-500",
          helperTextClassName
        )}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// Form validation schema builder
export function createValidationSchema(schema: {
  [key: string]: ValidationRule | ValidationRule[];
}) {
  return schema;
}

// Common validation schemas
export const commonValidationSchemas = {
  login: createValidationSchema({
    email: { required: true, validate: validators.email },
    password: { required: true, minLength: 8 },
  }),
  
  register: createValidationSchema({
    username: { required: true, minLength: 3, maxLength: 20 },
    email: { required: true, validate: validators.email },
    password: { required: true, validate: validators.password },
    confirmPassword: {
      required: true,
      validate: (value: any) => {
        // This will be handled in the form validation logic
        return true;
      }
    },
  }),
  
  profile: createValidationSchema({
    firstName: { required: true, minLength: 2, maxLength: 50 },
    lastName: { required: true, minLength: 2, maxLength: 50 },
    email: { required: true, validate: validators.email },
    phone: { validate: validators.phone },
    age: { min: 13, max: 120 },
  }),
  
  meal: createValidationSchema({
    name: { required: true, minLength: 2, maxLength: 100 },
    description: { maxLength: 500 },
    calories: { min: 0, max: 5000 },
    protein: { min: 0, max: 500 },
    carbs: { min: 0, max: 500 },
    fat: { min: 0, max: 500 },
  }),
};

export default useFormValidation;