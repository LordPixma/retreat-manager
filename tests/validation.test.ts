// Tests for validation utilities
import { describe, it, expect } from 'vitest';
import { validate, attendeeCreateSchema, roomCreateSchema, groupSchema, announcementCreateSchema } from '../functions/_shared/validation.js';

describe('Validation Utilities', () => {
  describe('validate function', () => {
    it('should return valid for correct data', () => {
      const data = { name: 'John Doe', ref_number: 'REF001', password: 'securepass123' };
      const result = validate(data, attendeeCreateSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for missing required fields', () => {
      const data = { name: 'John Doe' };
      const result = validate(data, attendeeCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.ref_number).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });
  });

  describe('attendeeCreateSchema', () => {
    it('should validate valid attendee data', () => {
      const validData = {
        name: 'Jane Smith',
        ref_number: 'ATT001',
        password: 'password123',
        email: 'jane@example.com'
      };
      const result = validate(validData, attendeeCreateSchema);
      expect(result.valid).toBe(true);
    });

    it('should reject empty name', () => {
      const data = { name: '', ref_number: 'REF001', password: 'pass123' };
      const result = validate(data, attendeeCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should reject short password', () => {
      const data = { name: 'John', ref_number: 'REF001', password: '123' };
      const result = validate(data, attendeeCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject invalid email format', () => {
      const data = { name: 'John', ref_number: 'REF001', password: 'password123', email: 'invalid-email' };
      const result = validate(data, attendeeCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should allow optional email to be empty', () => {
      const data = { name: 'John', ref_number: 'REF001', password: 'password123' };
      const result = validate(data, attendeeCreateSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe('roomCreateSchema', () => {
    it('should validate valid room data', () => {
      const data = { number: 'A101', description: 'Deluxe room' };
      const result = validate(data, roomCreateSchema);
      expect(result.valid).toBe(true);
    });

    it('should reject empty room number', () => {
      const data = { number: '' };
      const result = validate(data, roomCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.number).toBeDefined();
    });

    it('should allow room without description', () => {
      const data = { number: 'B202' };
      const result = validate(data, roomCreateSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe('groupSchema', () => {
    it('should validate valid group data', () => {
      const data = { name: 'VIP Group' };
      const result = validate(data, groupSchema);
      expect(result.valid).toBe(true);
    });

    it('should reject empty group name', () => {
      const data = { name: '' };
      const result = validate(data, groupSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });
  });

  describe('announcementCreateSchema', () => {
    it('should validate valid announcement data', () => {
      const data = {
        title: 'Important Notice',
        content: 'Please read this announcement carefully.',
        type: 'general'
      };
      const result = validate(data, announcementCreateSchema);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid announcement type', () => {
      const data = {
        title: 'Test',
        content: 'Test content',
        type: 'invalid-type'
      };
      const result = validate(data, announcementCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.type).toBeDefined();
    });

    it('should reject announcement without title', () => {
      const data = { content: 'Test content', type: 'general' };
      const result = validate(data, announcementCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.title).toBeDefined();
    });

    it('should accept valid priority values', () => {
      const data = {
        title: 'Urgent',
        content: 'Urgent content',
        type: 'urgent',
        priority: 5
      };
      const result = validate(data, announcementCreateSchema);
      expect(result.valid).toBe(true);
    });

    it('should reject priority out of range', () => {
      const data = {
        title: 'Test',
        content: 'Content',
        type: 'general',
        priority: 10
      };
      const result = validate(data, announcementCreateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.priority).toBeDefined();
    });
  });
});
