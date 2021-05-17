import * as React from 'react';
import { fireEvent, getByRole, render, screen, waitFor } from '@testing-library/react';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import App from '../App';

const renderApp = () => {
  window.history.replaceState(null, '', '/index.eng.html');

  render(
    <>
      <meta id="meta-description" name="description" />
      <App />
    </>,
  );
};

const selectLocale = (name: string) => {
  const selector = screen
    .getAllByRole('combobox')
    .find((e) => Array.from(e.childNodes).some((c) => (c as HTMLOptionElement).value === 'eng')) as HTMLSelectElement;
  userEvent.selectOptions(selector, getByRole(selector, 'option', { name }));
};

it('switches to doc translation on hover', () => {
  renderApp();

  const body = document.getElementsByTagName('body')[0];

  fireEvent(body, new Event('dragenter'));

  expect(window.location.hash).toMatch(/^#docTranslation/);
});

describe('document level attributes', () => {
  it('sets on render', () => {
    renderApp();

    expect(document.title).toMatchInlineSnapshot(`"title-Default"`);

    const html = document.getElementsByTagName('html')[0];
    expect(html.dir).toBe('ltr');
    expect(html.lang).toBe('en');

    expect((document.getElementById('meta-description') as HTMLMetaElement).content).toMatchInlineSnapshot(
      `"description-Default"`,
    );
  });

  it('falls back to alpha3 code for <html> lang', () => {
    renderApp();

    selectLocale('arpetan');

    const html = document.getElementsByTagName('html')[0];
    expect(html.lang).toBe('frp');
  });
});

describe('changing locale', () => {
  it('switches on select', async () => {
    renderApp();

    selectLocale('español');

    const title = 'title-Spanish';
    mockAxios.mockResponse({ data: { title } });
    await waitFor(() => expect(mockAxios).toHaveBeenCalledWith(expect.objectContaining({ url: 'strings/spa.json' })));

    await waitFor(() => expect(document.title).toBe(title));
  });

  it('caches results', async () => {
    renderApp();

    selectLocale('español');

    mockAxios.mockResponse({ data: { title: 'title-Spanish' } });
    await waitFor(() => expect(mockAxios).toHaveBeenCalledWith(expect.objectContaining({ url: 'strings/spa.json' })));

    selectLocale('English');
    selectLocale('español');

    expect(mockAxios.queue()).toHaveLength(0);
  });
});
