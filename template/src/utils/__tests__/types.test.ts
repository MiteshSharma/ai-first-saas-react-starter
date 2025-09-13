import { createSuccess, createError, isSuccess, isError } from '../types';

describe('Result utility types', () => {
  describe('createSuccess', () => {
    it('should create a success result', () => {
      const data = { message: 'test' };
      const result = createSuccess(data);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('should create success result with null data', () => {
      const result = createSuccess(null);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('createError', () => {
    it('should create an error result with string message', () => {
      const message = 'Test error';
      const result = createError(message);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(message);
      }
    });

    it('should create an error result with Error object', () => {
      const error = new Error('Test error');
      const result = createError(error);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle error object with message property', () => {
      const error = { message: 'Custom error' };
      const result = createError(error);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle unknown error types', () => {
      const error = { code: 500, details: 'Server error' };
      const result = createError(error);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('isSuccess', () => {
    it('should return true for success result', () => {
      const result = createSuccess('test');
      expect(isSuccess(result)).toBe(true);
    });

    it('should return false for error result', () => {
      const result = createError('test error');
      expect(isSuccess(result)).toBe(false);
    });
  });

  describe('isError', () => {
    it('should return true for error result', () => {
      const result = createError('test error');
      expect(isError(result)).toBe(true);
    });

    it('should return false for success result', () => {
      const result = createSuccess('test');
      expect(isError(result)).toBe(false);
    });
  });
});