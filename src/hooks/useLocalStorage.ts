import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Store initialValue in a ref to avoid recreating readValue when initialValue changes reference
  const initialValueRef = useRef(initialValue);
  
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // Get initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(prev) : value;
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch custom storage event for sync across multiple components
          window.dispatchEvent(new Event('local-storage-update'));
        }
        return valueToStore;
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
        return prev;
      }
    });
  }, [key]);

  useEffect(() => {
    setStoredValue(readValue());
    
    // Sync hooks when storage updates elsewhere
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}
