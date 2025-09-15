import { renderHook, act } from '@testing-library/react';
import { useTestStore } from '../TestStore';

describe('TestStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useTestStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should initialize with count 0', () => {
    const { result } = renderHook(() => useTestStore());
    expect(result.current.count).toBe(0);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useTestStore());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useTestStore());
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(-1);
  });

  it('should reset count to 0', () => {
    const { result } = renderHook(() => useTestStore());
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(2);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(0);
  });
});
