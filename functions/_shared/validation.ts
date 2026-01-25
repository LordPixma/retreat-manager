// Input validation utilities for retreat-manager

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Validator function type
export type ValidatorFn<T = unknown> = (value: T, fieldName: string) => string | null;

// Core validators
export const validators = {
  required: (value: unknown, fieldName: string): string | null => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || value === '') {
      return null; // Use required validator for required check
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value !== 'string' || !emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  minLength:
    (min: number) =>
    (value: unknown, fieldName: string): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      if (typeof value === 'string' && value.length < min) {
        return `${fieldName} must be at least ${min} characters`;
      }
      return null;
    },

  maxLength:
    (max: number) =>
    (value: unknown, fieldName: string): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      if (typeof value === 'string' && value.length > max) {
        return `${fieldName} must be at most ${max} characters`;
      }
      return null;
    },

  enum:
    <T extends string>(allowedValues: readonly T[]) =>
    (value: unknown, fieldName: string): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      if (!allowedValues.includes(value as T)) {
        return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
      }
      return null;
    },

  range:
    (min: number, max: number) =>
    (value: unknown, fieldName: string): string | null => {
      if (value === undefined || value === null || value === '') {
        return null;
      }
      const num = Number(value);
      if (isNaN(num) || num < min || num > max) {
        return `${fieldName} must be between ${min} and ${max}`;
      }
      return null;
    },

  integer: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (!Number.isInteger(Number(value))) {
      return `${fieldName} must be an integer`;
    }
    return null;
  },

  positiveNumber: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  array: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Array.isArray(value)) {
      return `${fieldName} must be an array`;
    }
    return null;
  },

  nonEmptyArray: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Array.isArray(value) || value.length === 0) {
      return `${fieldName} must be a non-empty array`;
    }
    return null;
  },

  date: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (typeof value !== 'string') {
      return `${fieldName} must be a valid date string`;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${fieldName} must be a valid date`;
    }
    return null;
  },

  boolean: (value: unknown, fieldName: string): string | null => {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value !== 'boolean') {
      return `${fieldName} must be a boolean`;
    }
    return null;
  }
};

// Field validation schema type
export interface FieldSchema {
  validators: ValidatorFn<unknown>[];
  optional?: boolean;
}

export type ValidationSchema = Record<string, FieldSchema>;

// Validate data against schema
export function validate(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName];

    for (const validatorFn of fieldSchema.validators) {
      const error = validatorFn(value, fieldName);
      if (error) {
        errors[fieldName] = error;
        break; // Stop at first error for this field
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// Pre-built validation schemas for common entities

export const attendeeCreateSchema: ValidationSchema = {
  name: { validators: [validators.required, validators.maxLength(255)] },
  ref_number: { validators: [validators.required, validators.maxLength(50)] },
  password: { validators: [validators.required, validators.minLength(6)] },
  email: { validators: [validators.email], optional: true },
  phone: { validators: [validators.maxLength(50)], optional: true },
  payment_due: { validators: [validators.positiveNumber], optional: true },
  payment_status: {
    validators: [validators.enum(['pending', 'partial', 'paid', 'overdue'] as const)],
    optional: true
  },
  room_id: { validators: [validators.integer], optional: true },
  group_id: { validators: [validators.integer], optional: true }
};

export const attendeeUpdateSchema: ValidationSchema = {
  name: { validators: [validators.maxLength(255)], optional: true },
  ref_number: { validators: [validators.maxLength(50)], optional: true },
  email: { validators: [validators.email], optional: true },
  phone: { validators: [validators.maxLength(50)], optional: true },
  payment_due: { validators: [validators.positiveNumber], optional: true },
  payment_status: {
    validators: [validators.enum(['pending', 'partial', 'paid', 'overdue'] as const)],
    optional: true
  },
  room_id: { validators: [validators.integer], optional: true },
  group_id: { validators: [validators.integer], optional: true },
  password: { validators: [validators.minLength(6)], optional: true }
};

export const roomCreateSchema: ValidationSchema = {
  number: { validators: [validators.required, validators.maxLength(50)] },
  description: { validators: [validators.maxLength(500)], optional: true },
  capacity: { validators: [validators.integer, validators.range(1, 100)], optional: true },
  floor: { validators: [validators.maxLength(50)], optional: true },
  room_type: {
    validators: [validators.enum(['single', 'double', 'suite', 'family', 'standard'] as const)],
    optional: true
  }
};

export const roomUpdateSchema: ValidationSchema = {
  number: { validators: [validators.maxLength(50)], optional: true },
  description: { validators: [validators.maxLength(500)], optional: true },
  capacity: { validators: [validators.integer, validators.range(1, 100)], optional: true },
  floor: { validators: [validators.maxLength(50)], optional: true },
  room_type: {
    validators: [validators.enum(['single', 'double', 'suite', 'family', 'standard'] as const)],
    optional: true
  }
};

export const groupCreateSchema: ValidationSchema = {
  name: { validators: [validators.required, validators.maxLength(255)] },
  description: { validators: [validators.maxLength(1000)], optional: true },
  max_members: { validators: [validators.integer, validators.range(1, 1000)], optional: true }
};

export const groupUpdateSchema: ValidationSchema = {
  name: { validators: [validators.maxLength(255)], optional: true },
  description: { validators: [validators.maxLength(1000)], optional: true },
  max_members: { validators: [validators.integer, validators.range(1, 1000)], optional: true }
};

export const announcementCreateSchema: ValidationSchema = {
  title: { validators: [validators.required, validators.maxLength(255)] },
  content: { validators: [validators.required, validators.maxLength(10000)] },
  type: {
    validators: [validators.enum(['general', 'urgent', 'event', 'reminder'] as const)],
    optional: true
  },
  priority: { validators: [validators.integer, validators.range(1, 5)], optional: true },
  is_active: { validators: [validators.boolean], optional: true },
  target_audience: {
    validators: [validators.enum(['all', 'vip', 'groups'] as const)],
    optional: true
  },
  target_groups: { validators: [validators.array], optional: true },
  author_name: { validators: [validators.maxLength(255)], optional: true },
  starts_at: { validators: [validators.date], optional: true },
  expires_at: { validators: [validators.date], optional: true }
};

export const announcementUpdateSchema: ValidationSchema = {
  title: { validators: [validators.maxLength(255)], optional: true },
  content: { validators: [validators.maxLength(10000)], optional: true },
  type: {
    validators: [validators.enum(['general', 'urgent', 'event', 'reminder'] as const)],
    optional: true
  },
  priority: { validators: [validators.integer, validators.range(1, 5)], optional: true },
  is_active: { validators: [validators.boolean], optional: true },
  target_audience: {
    validators: [validators.enum(['all', 'vip', 'groups'] as const)],
    optional: true
  },
  target_groups: { validators: [validators.array], optional: true },
  starts_at: { validators: [validators.date], optional: true },
  expires_at: { validators: [validators.date], optional: true }
};

export const emailSendSchema: ValidationSchema = {
  subject: { validators: [validators.required, validators.maxLength(255)] },
  message: { validators: [validators.required, validators.maxLength(50000)] },
  target_audience: {
    validators: [validators.enum(['all', 'vip', 'groups'] as const)],
    optional: true
  },
  target_groups: { validators: [validators.array], optional: true },
  attendee_ids: { validators: [validators.array], optional: true },
  email_type: {
    validators: [validators.enum(['announcement', 'urgent', 'welcome', 'payment', 'reminder'] as const)],
    optional: true
  }
};

export const individualEmailSchema: ValidationSchema = {
  attendee_id: { validators: [validators.required, validators.integer] },
  subject: { validators: [validators.required, validators.maxLength(255)] },
  message: { validators: [validators.required, validators.maxLength(50000)] },
  email_type: {
    validators: [validators.enum(['announcement', 'urgent', 'welcome', 'payment', 'reminder'] as const)],
    optional: true
  }
};

export const loginSchema: ValidationSchema = {
  ref: { validators: [validators.required] },
  password: { validators: [validators.required] }
};

export const adminLoginSchema: ValidationSchema = {
  user: { validators: [validators.required] },
  pass: { validators: [validators.required] }
};

// Public registration schema
export const registrationSchema: ValidationSchema = {
  name: { validators: [validators.required, validators.maxLength(255)] },
  email: { validators: [validators.required, validators.email, validators.maxLength(255)] },
  phone: { validators: [validators.maxLength(50)], optional: true },
  emergency_contact: { validators: [validators.maxLength(255)], optional: true },
  dietary_requirements: { validators: [validators.maxLength(500)], optional: true },
  special_requests: { validators: [validators.maxLength(1000)], optional: true },
  preferred_room_type: {
    validators: [validators.enum(['single', 'double', 'suite', 'family', 'standard'] as const)],
    optional: true
  },
  payment_option: {
    validators: [validators.required, validators.enum(['full', 'installments', 'sponsorship'] as const)]
  }
};
