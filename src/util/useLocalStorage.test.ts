import { RenderResult, act, renderHook } from '@testing-library/react-hooks';

import useLocalStorage from './useLocalStorage';

const localStorageKey = () => Math.random().toString(36);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      noRenderError(): R;
      renderValueToBe<T>(value: T): R;
    }
  }
}

expect.extend({
  noRenderError<T>(result: RenderResult<[T, React.Dispatch<React.SetStateAction<T>>]>) {
    return {
      message: () => `expected error to be empty`,
      pass: result.error == null,
    };
  },
  renderValueToBe<T>(result: RenderResult<[T, React.Dispatch<React.SetStateAction<T>>]>, value: T) {
    return {
      message: () => `expected ${new String(result.current[0]).toString()} to be ${new String(value).toString()}`,
      pass: result.current[0] === value,
    };
  },
});

it('uses initial value', () => {
  const { result } = renderHook(() => useLocalStorage(localStorageKey(), 'bar'));
  expect(result).noRenderError();
  expect(result).renderValueToBe('bar');
});

it('uses initial function value', () => {
  const { result } = renderHook(() => useLocalStorage(localStorageKey(), () => 'bar'));
  expect(result).noRenderError();
  expect(result).renderValueToBe('bar');
});

it('sets new value', () => {
  const { result } = renderHook(() => useLocalStorage(localStorageKey(), 'bar'));
  expect(result).noRenderError();
  act(() => result.current[1]('qux'));
  expect(result).renderValueToBe('qux');
});

it('sets new function value', () => {
  const { result } = renderHook(() => useLocalStorage(localStorageKey(), 'bar'));
  expect(result).noRenderError();
  act(() => result.current[1]((s) => s + s));
  expect(result).renderValueToBe('barbar');
});

it('restores saved value', () => {
  const key = localStorageKey();
  const { result } = renderHook(() => useLocalStorage(key, 'bar'));
  expect(result).noRenderError();

  {
    const { result } = renderHook(() => useLocalStorage(key, 'qux'));
    expect(result).noRenderError();
    expect(result).renderValueToBe('bar');
  }
});

it('uses override value over initial value', () => {
  const { result } = renderHook(() => useLocalStorage(localStorageKey(), 'bar', { overrideValue: 'qux' }));
  expect(result).noRenderError();
  expect(result).renderValueToBe('qux');
});

it('uses override value over saved value', () => {
  const key = localStorageKey();
  const { result } = renderHook(() => useLocalStorage(key, 'bar'));
  expect(result).noRenderError();

  {
    const { result } = renderHook(() => useLocalStorage(key, 'bar', { overrideValue: 'qux' }));
    expect(result).noRenderError();
    expect(result).renderValueToBe('qux');
  }
});

it('discards saved value that fails validation', () => {
  const key = localStorageKey();
  const { result } = renderHook(() => useLocalStorage(key, 'bar'));
  expect(result).noRenderError();

  {
    const { result } = renderHook(() => useLocalStorage(key, 'barr', { validateValue: (s) => s.length === 4 }));
    expect(result).noRenderError();
    expect(result).renderValueToBe('barr');
  }
});

it('discards override value that fails validation', () => {
  const { result } = renderHook(() =>
    useLocalStorage(localStorageKey(), 'bar', { overrideValue: 'barr', validateValue: (s) => s.length === 3 }),
  );
  expect(result).noRenderError();
  expect(result).renderValueToBe('bar');
});

it('discards invalid saved value', () => {
  const key = localStorageKey();
  window.localStorage.setItem(key, 'I AM NOT VALID JSON');
  const { result } = renderHook(() => useLocalStorage(key, 'bar'));
  expect(result).noRenderError();
  expect(result).renderValueToBe('bar');
});
