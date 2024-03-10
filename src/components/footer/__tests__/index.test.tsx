import * as React from 'react';
import { getAllByRole, render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

import Config from '../../../../config';
import { ConfigContext } from '../../../context';
import { Config as ConfigType } from '../../../types';
import { createMemoryHistory } from 'history';

import Footer from '..';

const renderFooter = (config: Partial<ConfigType> = {}) => {
  const wrapRef = React.createRef<HTMLDivElement>();
  const pushRef = React.createRef<HTMLDivElement>();
  const history = createMemoryHistory();

  render(
    <ConfigContext.Provider value={{ ...Config, ...config }}>
      <>
        <div ref={wrapRef}>
          <div ref={pushRef} />
        </div>
        <Router history={history}>
          <Footer pushRef={pushRef} wrapRef={wrapRef} />
        </Router>
      </>
    </ConfigContext.Provider>,
  );
};

describe('Footer', () => {
  it('renders with navigation buttons', () => {
    renderFooter();
    const navigation = screen.getByRole('navigation');
    const buttons = getAllByRole(navigation, 'button');
    expect(buttons).toHaveLength(4);
  });

  it('closes dialogs on click', async () => {
    renderFooter();

    userEvent.click(screen.getByRole('button', { name: 'About-Default' }));
    expect(screen.getByRole('dialog')).toBeDefined();

    userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')?.style.opacity).toBe(''));
  });

  describe('navigation buttons', () => {
    it('opens about dialog and display show more languages link when showMoreLanguagesLink is set to true', () => {
      renderFooter({ showMoreLanguagesLink: true });

      userEvent.click(screen.getByRole('button', { name: 'About-Default' }));

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"About_Apertium-Default×CloseWhat_Is_Apertium-DefaultApertium-DefaultMore_Languages-Default"`,
      );
    });

    it('opens about dialog and does not display show more languages link when showMoreLanguagesLink is set to false', () => {
      renderFooter({ showMoreLanguagesLink: false });

      userEvent.click(screen.getByRole('button', { name: 'About-Default' }));

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"About_Apertium-Default×CloseWhat_Is_Apertium-DefaultApertium-Default"`,
      );
    });

    it('opens download dialog', () => {
      renderFooter();

      userEvent.click(screen.getByRole('button', { name: 'Download-Default' }));

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"Apertium_Downloads-Default×CloseDownloads_Para-Default"`,
      );
    });

    it('opens documentation dialog', () => {
      renderFooter();

      userEvent.click(screen.getByRole('button', { name: 'Documentation-Default' }));

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"Apertium_Documentation-Default×CloseDocumentation_Para-Default"`,
      );
    });

    it('opens contact dialog', () => {
      renderFooter();

      userEvent.click(screen.getByRole('button', { name: 'Contact-Default' }));

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"Contact-Default×CloseContact_Us-DefaultContact_Para-Default"`,
      );
    });
  });

  describe('help improve buttons', () => {
    it('opens about dialog on mobile', () => {
      renderFooter();

      userEvent.click(screen.getAllByRole('button', { name: 'Help_Improve-Default' })[0]);

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"About_Apertium-Default×CloseWhat_Is_Apertium-DefaultApertium-Default"`,
      );
    });

    it('opens about dialog on desktop', () => {
      renderFooter();

      userEvent.click(screen.getAllByRole('button', { name: 'Help_Improve-Default' })[0]);

      expect(screen.getByRole('dialog').textContent).toMatchInlineSnapshot(
        `"About_Apertium-Default×CloseWhat_Is_Apertium-DefaultApertium-Default"`,
      );
    });
  });
});
