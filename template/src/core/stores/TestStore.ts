import { create } from 'zustand';

interface TestStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

/**
 * @store useTestStore
 * @description A test store to verify Zustand configuration
 */
export const useTestStore = create<TestStore>((set) => ({
  count: 0,
  
  increment: () => set((state: TestStore) => ({ count: state.count + 1 })),
  
  decrement: () => set((state: TestStore) => ({ count: state.count - 1 })),
  
  reset: () => set({ count: 0 }),
}));
