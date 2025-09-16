import { getItem, setItem, removeItem, clear, hasItem, getAllKeys } from '../localStorage';

describe('localStorage utilities', () => {
  const key = 'test-key';
  const value = { test: 'data' };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve data', () => {
      setItem(key, value);
      const retrieved = getItem(key);
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const retrieved = getItem('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should handle JSON parsing errors', () => {
      localStorage.setItem(key, 'invalid-json');
      const retrieved = getItem(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove stored data', () => {
      setItem(key, value);
      removeItem(key);
      const retrieved = getItem(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');
      clear();
      
      expect(getItem('key1')).toBeNull();
      expect(getItem('key2')).toBeNull();
    });
  });

  describe('hasItem', () => {
    it('should return true for existing key', () => {
      setItem(key, value);
      expect(hasItem(key)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(hasItem('non-existent')).toBe(false);
    });
  });

  describe('getAllKeys', () => {
    it('should return all keys', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');
      const keys = getAllKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return empty array when no keys exist', () => {
      clear();
      const keys = getAllKeys();
      expect(keys).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle storage quota exceeded', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => setItem(key, value)).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });
});