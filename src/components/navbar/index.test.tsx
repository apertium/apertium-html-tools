import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { getAllByRole, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import Config from '../../../config';
import { ConfigContext } from '../../context';
import { Config as ConfigType } from '../../types';
import Navbar from '.';

const renderNavbar = (options?: MemoryHistoryBuildOptions, config: Partial<ConfigType> = {}): MemoryHistory => {
  const history = createMemoryHistory(options);
  const setLocale = jest.fn();

  render(
    <ConfigContext.Provider value={{ ...Config, ...config }}>
      <Router history={history}>
        <Navbar setLocale={setLocale} />
      </Router>
    </ConfigContext.Provider>,
  );

  return history;
};

it('renders navigation options', () => {
  renderNavbar();

  const navbar = screen.getByRole('navigation');
  const buttons = getAllByRole(navbar, 'button', { name: (n) => n !== 'Toggle navigation' });

  expect(buttons).toHaveLength(4);
});

it('defaults to translation', () => {
  renderNavbar();

  expect(screen.getByText('Translation-Default').className).toContain('active');
});

describe('subtitle', () => {
  const subtitle = 'I am a subtitle';

  it('renders text', () => {
    renderNavbar(undefined, { subtitle });
    expect(screen.getByText(subtitle)).toBeDefined();
  });

  it('renders with color', () => {
    const subtitleColor = 'green';
    renderNavbar(undefined, { subtitle, subtitleColor });
    expect(screen.getByText(subtitle).style.color).toBe('green');
  });

  it('renders without color', () => {
    renderNavbar(undefined, { subtitle, subtitleColor: undefined });
    expect(screen.getByText(subtitle).style.color).toBe('');
  });
});

describe('translation navigation', () => {
  it.each(['/translation', '/webpageTranslation', '/docTranslation'])('shows active link for %s', (pathname) => {
    renderNavbar({ initialEntries: [pathname] });
    expect(screen.getByText('Translation-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(screen.getByText('Translation-Default'));
    expect(history.location.pathname).toEqual('/translation');
  });
});

describe('analysis navigation', () => {
  it('shows an active link', () => {
    renderNavbar({ initialEntries: ['/analysis'] });
    expect(screen.getByText('Morphological_Analysis-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(screen.getByText('Morphological_Analysis-Default'));
    expect(history.location.pathname).toEqual('/analysis');
  });
});

describe('generation navigation', () => {
  it('shows an active link', () => {
    renderNavbar({ initialEntries: ['/generation'] });
    expect(screen.getByText('Morphological_Generation-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(screen.getByText('Morphological_Generation-Default'));
    expect(history.location.pathname).toEqual('/generation');
  });
});

describe('sandbox navigation', () => {
  it('shows an active link', () => {
    renderNavbar({ initialEntries: ['/sandbox'] });
    expect(screen.getByText('APy_Sandbox-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(screen.getByText('APy_Sandbox-Default'));
    expect(history.location.pathname).toEqual('/sandbox');
  });
});
