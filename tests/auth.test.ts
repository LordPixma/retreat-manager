// Tests for authentication utilities
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, needsPasswordUpgrade } from '../functions/_shared/auth.js';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should generate a hash string', async () => {
      const hash = await hashPassword('testpassword');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password (due to salt)', async () => {
      const hash1 = await hashPassword('samepassword');
      const hash2 = await hashPassword('samepassword');
      expect(hash1).not.toBe(hash2);
    });

    it('should generate hash with proper format', async () => {
      const hash = await hashPassword('password123');
      // PBKDF2 format: salt$hash (both in hex)
      expect(hash).toContain('$');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('correctpassword');
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('somepassword');
      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should handle special characters', async () => {
      const password = 'p@$$w0rd!#$%^&*()';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const password = 'password日本語';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('needsPasswordUpgrade', () => {
    it('should return true for old bcrypt-style hashes', () => {
      const oldHash = '$2b$10$somehashvalue';
      expect(needsPasswordUpgrade(oldHash)).toBe(true);
    });

    it('should return false for new PBKDF2 hashes', async () => {
      const newHash = await hashPassword('testpassword');
      expect(needsPasswordUpgrade(newHash)).toBe(false);
    });

    it('should return true for plain text passwords', () => {
      expect(needsPasswordUpgrade('plainpassword')).toBe(true);
    });
  });

  describe('Password security', () => {
    it('should use strong hashing (hash should be significantly longer than input)', async () => {
      const password = 'short';
      const hash = await hashPassword(password);
      expect(hash.length).toBeGreaterThan(password.length * 4);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);
      expect(isValid).toBe(true);
    });
  });
});
