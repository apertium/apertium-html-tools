import * as React from 'react';
import { MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { cleanup, getByRole, queryAllByRole, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { Mode, TranslateEvent } from '..';
import Translator from '../Translator';

const renderTranslator = (historyOptions?: MemoryHistoryBuildOptions, mode?: Mode) => {
  const history = createMemoryHistory(historyOptions);
  render(
    <Router history={history}>
      <Translator mode={mode} />
    </Router>,
  );
  return history;
};

const matchMobileMedia = (matches: boolean) => {
  const listeners = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      ...listeners,
      matches,
      media: query,
      onchange: null,
    })),
  });

  return listeners;
};

beforeEach(() => matchMobileMedia(true));

describe('initial modes', () => {
  test('default', () => {
    renderTranslator();
    expect(screen.getByRole('textbox', { name: 'Input_Text-Default' })).toBeDefined();
  });

  test('text', () => {
    renderTranslator({}, Mode.Text);
    expect(screen.getByRole('textbox', { name: 'Input_Text-Default' })).toBeDefined();
  });

  test('webpage', () => {
    renderTranslator({}, Mode.Webpage);
    expect((screen.getByRole('textbox') as HTMLInputElement).type).toBe('url');
  });

  test('document', () => {
    renderTranslator({}, Mode.Document);
    expect((screen.getByTestId('file-input') as HTMLInputElement).type).toBe('file');
  });
});

describe('default source language', () => {
  it('selects matching navigator language', () => {
    jest.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['hi-IN']);

    renderTranslator();

    expect((screen.getByTestId('src-lang-dropdown') as HTMLSelectElement).value).toBe('hin');
  });

  it('falls back to first language', () => {
    jest.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['zzz']);

    renderTranslator();

    expect((screen.getByTestId('src-lang-dropdown') as HTMLSelectElement).value).toBe('eng');
  });
});

describe('default settings', () => {
  it.each(['Mark_Unknown_Words-Default', 'Instant_Translation-Default', 'Multi_Step_Translation-Default'])(
    'restores %s',
    (option) => {
      renderTranslator();

      const initialValue = (screen.getByRole('checkbox', { name: option }) as HTMLInputElement).checked;
      userEvent.click(screen.getByRole('checkbox', { name: option }));

      cleanup();

      renderTranslator();
      expect((screen.getByRole('checkbox', { name: option }) as HTMLInputElement).checked).toBe(!initialValue);
    },
  );
});

describe('default pair', () => {
  it('uses URL parameters', () => {
    renderTranslator({ initialEntries: ['/?dir=cat-spa'] });

    expect((screen.getByTestId('src-lang-dropdown') as HTMLSelectElement).value).toBe('cat');
    expect((screen.getByTestId('tgt-lang-dropdown') as HTMLSelectElement).value).toBe('spa');
  });

  it('discards invalid URL parameters', () => {
    renderTranslator({ initialEntries: ['/?dir=foo-bar'] });

    expect((screen.getByTestId('src-lang-dropdown') as HTMLSelectElement).value).toBe('eng');
    expect((screen.getByTestId('tgt-lang-dropdown') as HTMLSelectElement).value).toBe('cat');
  });
});

describe('setting source language', () => {
  it('sets language on select', () => {
    renderTranslator();

    const dropdown = screen.getByTestId('src-lang-dropdown') as HTMLSelectElement;
    userEvent.selectOptions(dropdown, 'català');

    expect(dropdown.value).toBe('cat');
  });

  it('changes recent languages', async () => {
    matchMobileMedia(false);

    renderTranslator();

    const initialSrcLangs = queryAllByRole(screen.getByTestId('src-lang-buttons'), 'button').map((b) => b.textContent);

    const srcLangDropdown = screen.getByTestId('src-lang-dropdown');
    userEvent.click(getByRole(srcLangDropdown, 'button'));
    await waitFor(() => userEvent.click(getByRole(srcLangDropdown, 'button', { name: 'pan_Guru' })));

    const afterSrcLangs = queryAllByRole(screen.getByTestId('src-lang-buttons'), 'button').map((b) => b.textContent);

    expect(initialSrcLangs).not.toEqual(afterSrcLangs);
  });
});

it('dispatches translate event on submit', () => {
  renderTranslator();

  const listener = jest.fn();
  window.addEventListener(TranslateEvent, listener, false);

  (screen.getByRole('form', { name: 'Translate-Default' }) as HTMLFormElement).submit();

  expect(listener).toHaveBeenCalledTimes(1);
});

it('sets preferences', async () => {
  renderTranslator();

  userEvent.click(screen.getByRole('button', { name: 'Norm_Preferences-Default' }));

  const checkbox = (await screen.findByRole('checkbox', { name: 'foo_pref' })) as HTMLInputElement;
  userEvent.click(checkbox);

  expect(checkbox.checked).toBeTruthy();
});

it('sets target language', () => {
  renderTranslator();

  const dropdown = screen.getByTestId('tgt-lang-dropdown') as HTMLSelectElement;
  userEvent.selectOptions(dropdown, 'español');

  expect(dropdown.value).toBe('spa');
});
