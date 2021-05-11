import * as React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import mockAxios from 'jest-mock-axios';

import Config from '../../../config';
import { LocaleContext } from '../../context';
import WithLocale from '../WithLocale';

const setLocation = (location: string) => window.history.replaceState({}, '', location);

afterEach(() => setLocation('/'));

const ShowLocale: React.FunctionComponent<{ setLocale: React.Dispatch<React.SetStateAction<string>> }> = () => (
  <main>{React.useContext(LocaleContext)}</main>
);

const renderWithLocale = () => render(<WithLocale>{(props) => <ShowLocale {...props} />}</WithLocale>);

describe('default locale selection', () => {
  it('restores from browser state', () => {
    setLocation('/index.heb.html');
    renderWithLocale();

    cleanup();

    setLocation('/');
    renderWithLocale();

    expect(screen.getByRole('main').textContent).toEqual('heb');
  });

  it('prefers lang parameter over url path', () => {
    setLocation('/index.heb.html?lang=spa');
    renderWithLocale();
    expect(screen.getByRole('main').textContent).toEqual('spa');
  });

  it('prefers url path over browser storage', () => {
    setLocation('/index.heb.html');
    renderWithLocale();

    cleanup();

    setLocation('/index.spa.html');
    renderWithLocale();
    expect(screen.getByRole('main').textContent).toEqual('spa');
  });

  describe('fetching locale from APy', () => {
    it('uses valid response', async () => {
      renderWithLocale();

      mockAxios.mockResponse({ data: ['es'] });
      await waitFor(() =>
        expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining('/getLocale'), '', expect.anything()),
      );

      expect(screen.getByRole('main').textContent).toEqual('spa');
    });

    it('handles variants', () => {
      renderWithLocale();

      mockAxios.mockResponse({ data: ['en-US'] });

      expect(screen.getByRole('main').textContent).toEqual('eng');
    });

    it('falls back to default for unknown response', () => {
      renderWithLocale();

      mockAxios.mockResponse({ data: ['zzz'] });

      expect(screen.getByRole('main').textContent).toEqual(Config.defaultLocale);
    });

    it('falls back to default on failure', () => {
      renderWithLocale();

      mockAxios.mockError();

      expect(screen.getByRole('main').textContent).toEqual(Config.defaultLocale);
    });
  });
});
