import * as React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import { LocaleContext } from '../../context';
import WithLocale from '../WithLocale';

const originalLocation = window.location;

afterAll(() => (window.location = originalLocation));

const mockLocation = ({ search, pathname }: { search?: string; pathname?: string }) => {
  // eslint-disable-next-line
  delete (window as any).location;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  window.location = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(originalLocation),
      pathname: {
        configurable: true,
        value: pathname,
      },
      search: {
        configurable: true,
        value: search,
      },
      assign: {
        configurable: true,
        value: jest.fn(),
      },
    },
  );
};

const ShowLocale: React.FunctionComponent<{ setLocale: React.Dispatch<React.SetStateAction<string>> }> = () => (
  <main>{React.useContext(LocaleContext)}</main>
);

const renderWithLocale = () => render(<WithLocale>{(props) => <ShowLocale {...props} />}</WithLocale>);

describe('default locale selection', () => {
  it('restores from browser state', () => {
    mockLocation({ pathname: '/index.heb.html' });
    renderWithLocale();

    cleanup();

    mockLocation({ pathname: '' });
    renderWithLocale();

    expect(screen.getByRole('main').textContent).toEqual('heb');
  });

  it('prioritizes lang parameter over url path', () => {
    mockLocation({ search: '?lang=spa', pathname: '/index.heb.html' });
    renderWithLocale();
    expect(screen.getByRole('main').textContent).toEqual('spa');
  });

  it('prioritizes url path over browser storage', () => {
    mockLocation({ pathname: '/index.heb.html' });
    renderWithLocale();

    cleanup();

    mockLocation({ pathname: '/index.spa.html' });
    renderWithLocale();
    expect(screen.getByRole('main').textContent).toEqual('spa');
  });
});
