import * as React from 'react';

// Modeled after https://usehooks.com/useLocalStorage/.

const storeValue = <T>(key: string, value: T) => {
  const serializedValue = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.warn(`Failed to set LocalStorage[${key}] = ${serializedValue}`, error);
  }
};

export default <T>(
  key: string,
  initialValue: T | (() => T),
  options?: {
    overrideValue?: T | null;
    validateValue?: (value: T) => boolean;
  },
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const { overrideValue, validateValue } = options || {};
  const validateValueFinal = validateValue || (() => true);

  const [stateValue, setStateValue] = React.useState<T>(() => {
    if (overrideValue && validateValueFinal(overrideValue)) {
      storeValue(key, overrideValue);
      return overrideValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item) as T;
        if (validateValueFinal(parsedItem)) {
          return parsedItem;
        }
      }
    } catch (error) {
      console.warn(`Failed to parse LocalStorage[${key}]`, error);
    }

    const value = initialValue instanceof Function ? initialValue() : initialValue;
    storeValue(key, value);
    return value;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const finalValue = value instanceof Function ? value(stateValue) : value;
    setStateValue(finalValue);
    storeValue(key, finalValue);
  };

  return [stateValue, setValue];
};
