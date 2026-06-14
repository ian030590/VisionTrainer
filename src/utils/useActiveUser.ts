import { useSyncExternalStore } from 'react';
import { ACTIVE_USER_CHANGED_EVENT, getActiveUser } from './settings';

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(ACTIVE_USER_CHANGED_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(ACTIVE_USER_CHANGED_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export function useActiveUser(): string | null {
  return useSyncExternalStore(subscribe, getActiveUser, getActiveUser);
}
