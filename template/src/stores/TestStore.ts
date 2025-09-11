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
export const useTestStore = create<TestStore>((set: any) => ({
  count: 0,
  
  increment: () => set((state: any) => ({ count: state.count + 1 })),
  
  decrement: () => set((state: any) => ({ count: state.count - 1 })),
  
  reset: () => set({ count: 0 }),
}));
