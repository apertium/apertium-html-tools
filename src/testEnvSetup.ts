import mockAxios from 'jest-mock-axios';

afterEach(() => {
  mockAxios.reset();
  window.localStorage.clear();
});
