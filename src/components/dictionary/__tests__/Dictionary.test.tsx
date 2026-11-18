import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import App from '../../../App';

const renderApp = (url = '/index.eng.html#dictionary') => {
  window.history.replaceState(null, '', url);

  render(
    <>
      <meta id="meta-description" name="description" />
      <App />
    </>,
  );
};

it('renders dictionary mode from the URL', async () => {
  renderApp();

  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: [{ sourceLanguage: 'eng', targetLanguage: 'spa' }] } });
  });

  expect(await screen.findByPlaceholderText('Type_A_Word-Default')).toBeDefined();
  expect(window.location.hash).toMatch(/^#dictionary\?langpair=eng-spa$/);
});

it('selects a different language pair from the dropdown', async () => {
  renderApp();

  await act(async () => {
    mockAxios.mockResponse({
      data: {
        responseData: [
          { sourceLanguage: 'eng', targetLanguage: 'spa' },
          { sourceLanguage: 'spa', targetLanguage: 'eng' },
        ],
      },
    });
  });

  const srcDropdown = screen.getByTestId('src-lang-dropdown');
  userEvent.click(srcDropdown);
  userEvent.selectOptions(srcDropdown, 'spa');

  await waitFor(() => {
    expect((srcDropdown as HTMLSelectElement).value).toBe('spa');
    expect((screen.getByTestId('tgt-lang-dropdown') as HTMLSelectElement).value).toBe('eng');
    expect(window.location.hash).toContain('langpair=spa-eng');
    expect(window.localStorage.getItem('dictSrcLang')).toBe(JSON.stringify('spa'));
    expect(window.localStorage.getItem('dictTgtLang')).toBe(JSON.stringify('eng'));
  });
});

it('restores a previously selected dictionary pair', async () => {
  window.localStorage.setItem('dictSrcLang', JSON.stringify('unm'));
  window.localStorage.setItem('dictTgtLang', JSON.stringify('eng'));

  renderApp();

  await act(async () => {
    mockAxios.mockResponse({
      data: {
        responseData: [
          { sourceLanguage: 'unm', targetLanguage: 'eng' },
          // eng has more choices, but should not override the saved Unm source.
          { sourceLanguage: 'eng', targetLanguage: 'uum' },
          { sourceLanguage: 'eng', targetLanguage: 'spa' },
        ],
      },
    });
  });

  await waitFor(() => {
    expect((screen.getByTestId('src-lang-dropdown') as HTMLSelectElement).value).toBe('unm');
    expect((screen.getByTestId('tgt-lang-dropdown') as HTMLSelectElement).value).toBe('eng');
    expect(window.location.hash).toContain('langpair=unm-eng');
  });
});

it('prunes stale recent target languages for the active source language', async () => {
  window.localStorage.setItem('dictSrcLang', JSON.stringify('eng'));
  window.localStorage.setItem('dictTgtLang', JSON.stringify('spa'));
  window.localStorage.setItem('dictRecentTgtLangs', JSON.stringify(['eng', 'unm', 'uum']));

  renderApp();

  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: [{ sourceLanguage: 'eng', targetLanguage: 'spa' }] } });
  });

  await waitFor(() => {
    expect(JSON.parse(window.localStorage.getItem('dictRecentTgtLangs') || '[]')).toEqual(['spa']);
  });
});

it('shows no results when a word is not found', async () => {
  renderApp();

  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: [{ sourceLanguage: 'eng', targetLanguage: 'spa' }] } });
  });

  const input = await screen.findByPlaceholderText('Type_A_Word-Default');
  userEvent.type(input, 'cantar');
  await waitFor(() => {
    expect(window.location.hash.startsWith('#dictionary?')).toBe(true);
    const query = new URLSearchParams(window.location.hash.split('?')[1]);
    expect(query.get('q')).toBe('cantar');
    expect(query.get('langpair')).toBe('eng-spa');
    expect(window.location.hash.match(/\?/g)).toHaveLength(1);
    expect(window.location.hash).toMatch(/^#dictionary\?langpair=eng-spa&q=cantar$/);
  });
  userEvent.click(screen.getByRole('button', { name: 'Search-Default' }));

  await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(3));
  // Both dictionary directions return no entries for this search term.
  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: { lookupResults: [] } } });
    mockAxios.mockResponse({ data: { responseData: { lookupResults: [] } } });
  });

  // An empty dictionary result also checks for related embedding modes.
  await waitFor(() => expect(mockAxios.queue().length).toBeGreaterThan(0));
  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: [] } });
  });

  expect(await screen.findByText('No_results_found-Default')).toBeDefined();
});

it('searches for a word and expands its paradigm', async () => {
  renderApp();

  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: [{ sourceLanguage: 'uum', targetLanguage: 'eng' }] } });
  });

  const input = await screen.findByPlaceholderText('Type_A_Word-Default');
  userEvent.type(input, 'ат');
  userEvent.click(screen.getByRole('button', { name: 'Search-Default' }));

  await waitFor(() => expect(mockAxios.post).toHaveBeenCalledTimes(3));
  await act(async () => {
    mockAxios.mockResponse({
      data: {
        responseData: {
          lookupResults: [
            {
              'ат<n>': ['name<n>', 'horse<n>'],
              'extra-tags': ['<nom>'],
            },
            {
              'ат<v><iv>': ['jump# over<vblex>', 'jump# across<vblex>'],
              'extra-tags': ['<imp><p2><sg>'],
            },
            {
              'ат<v><tv>': ['shoot<vblex>', 'throw<vblex>'],
              'extra-tags': ['<imp><p2><sg>'],
            },
          ],
        },
      },
    });
    mockAxios.mockResponse({ data: { responseData: { lookupResults: [] } } });
  });

  const expandButton = (await screen.findAllByRole('button', { name: 'Expand_Paradigms-Default' }))[0];
  userEvent.click(expandButton);

  await waitFor(() => expect(mockAxios.queue().length).toBeGreaterThan(0));
  await act(async () => {
    Array.from({ length: mockAxios.queue().length }, () => mockAxios.mockResponse({ data: [['ат', '']] }));
  });

  await waitFor(() => expect(document.querySelector('.paradigm-container')).not.toBeNull());
});
