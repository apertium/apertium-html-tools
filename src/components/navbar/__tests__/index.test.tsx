import * as React from 'react';
import { MemoryHistory, MemoryHistoryBuildOptions, createMemoryHistory } from 'history';
import { getAllByRole, getByText, queryAllByRole, render, screen, within } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import { Config as ConfigType, Mode } from '../../../types';
import Config from '../../../../config';
import { ConfigContext } from '../../../context';
import Navbar from '..';

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

const withinMobileNavbar = () => within(screen.getByTestId('navbar-mobile'));

describe('navigation options', () => {
  it('includes links per mode', () => {
    renderNavbar();

    const navbar = screen.getByTestId('navbar-mobile');
    const links = getAllByRole(navbar, 'link', { name: (n) => n !== 'Toggle navigation' });

    expect(links).toHaveLength(5);
  });

  it('includes button', () => {
    renderNavbar();

    const navbar = screen.getByTestId('navbar-mobile');
    const buttons = queryAllByRole(navbar, 'button');

    expect(buttons).toHaveLength(0);
  });

  describe('with only one mode enabled', () => {
    it('hides links', () => {
      renderNavbar(undefined, { enabledModes: new Set([Mode.Translation]) });

      const navbar = screen.getByRole('navigation');
      const links = queryAllByRole(navbar, 'link');

      expect(links).toHaveLength(0);
    });

    it('hides button', () => {
      renderNavbar(undefined, { enabledModes: new Set([Mode.Translation]) });

      const navbar = screen.getByRole('navigation');
      const buttons = queryAllByRole(navbar, 'button');

      expect(buttons).toHaveLength(0);
    });
  });
});

it('defaults to translation', () => {
  renderNavbar();

  const navbar = screen.getByTestId('navbar-mobile');
  expect(getByText(navbar, 'Translation-Default').className).toContain('active');
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
    expect(withinMobileNavbar().getByText('Translation-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(withinMobileNavbar().getByText('Translation-Default'));
    expect(history.location.pathname).toEqual('/translation');
  });
});

describe('analysis navigation', () => {
  it('shows an active link', () => {
    renderNavbar({ initialEntries: ['/analysis'] });
    expect(withinMobileNavbar().getByText('Morphological_Analysis-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(withinMobileNavbar().getByText('Morphological_Analysis-Default'));
    expect(history.location.pathname).toEqual('/analysis');
  });
});

describe('generation navigation', () => {
  it('shows an active link', () => {
    renderNavbar({ initialEntries: ['/generation'] });
    expect(withinMobileNavbar().getByText('Morphological_Generation-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(withinMobileNavbar().getByText('Morphological_Generation-Default'));
    expect(history.location.pathname).toEqual('/generation');
  });
});

describe('sandbox navigation', () => {
  it('shows an active link', () => {
    renderNavbar({ initialEntries: ['/sandbox'] });
    expect(withinMobileNavbar().getByText('APy_Sandbox-Default').className).toContain('active');
  });

  it('navigates on button click', () => {
    const history = renderNavbar();
    userEvent.click(withinMobileNavbar().getByText('APy_Sandbox-Default'));
    expect(history.location.pathname).toEqual('/sandbox');
  });
});
