import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = (initialData: any, rules: ValidationRules) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = (name: string, value: any): string => {
    const rule = rules[name];
    if (!rule) return '';

    if (rule.required && (!value || value.toString().trim() === '')) {
      return `${name} is required`;
    }

    if (value && rule.minLength && value.toString().length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }

    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      return `${name} must be no more than ${rule.maxLength} characters`;
    }

    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      return `${name} format is invalid`;
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (typeof result === 'string') return result;
      if (result === false) return `${name} is invalid`;
    }

    return '';
  };

  const validateAllFields = () => {
    const newErrors: ValidationErrors = {};
    let hasErrors = false;

    Object.keys(rules).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setIsValid(!hasErrors);
    return !hasErrors;
  };

  const updateField = (name: string, value: any) => {
    setData((prev: any) => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on change
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const resetForm = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
    setIsValid(false);
  };

  const submitForm = (onSubmit: (data: any) => void) => {
    const isFormValid = validateAllFields();
    if (isFormValid) {
      onSubmit(data);
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    validateAllFields();
  }, [data]);

  return {
    data,
    errors,
    touched,
    isValid,
    updateField,
    validateAllFields,
    resetForm,
    submitForm,
  };
};