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
  });
});

it('shows no results when a word is not found', async () => {
  renderApp();

  await act(async () => {
    mockAxios.mockResponse({ data: { responseData: [{ sourceLanguage: 'eng', targetLanguage: 'spa' }] } });
  });

  const input = await screen.findByPlaceholderText('Type_A_Word-Default');
  userEvent.type(input, 'cantar');
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
