/**
 * Safe localStorage Utilities
 * Handles try/catch and provides fallbacks for corrupted state
 */

export const getSafeItem = <T>(key: string, fallback: T, validator?: (val: any) => boolean): T => {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    
    // For strings, return directly or validate
    if (typeof fallback === 'string') {
      return (validator ? validator(val) : true) ? (val as unknown as T) : fallback;
    }

    // For other types, try parsing
    const parsed = JSON.parse(val);
    return (validator ? validator(parsed) : true) ? parsed : fallback;
  } catch (err) {
    console.warn(`SafeStorage: Failed to read key "${key}", falling back.`, err);
    return fallback;
  }
};

export const setSafeItem = (key: string, value: any): void => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (err) {
    console.error(`SafeStorage: Failed to set key "${key}".`, err);
  }
};

export const clearSafeItems = (keys: string[]): void => {
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`SafeStorage: Failed to remove key "${key}".`, err);
    }
  });
};
