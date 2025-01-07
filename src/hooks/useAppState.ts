import { useContext } from 'react';
import { StateContext } from '@/components/providers/StateProvider';

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
}