import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import mockAxios from 'jest-mock-axios';
import userEvent from '@testing-library/user-event';

import { APyContext } from '../../context';
import WithInstallationAlert from '../WithInstallationAlert';

const renderWithInstallationAlert = (length = 1) => {
  const TestElem = () => {
    const apyFetch = React.useContext(APyContext);
    Array.from({ length }, () => apyFetch(''));
    return null;
  };

  render(
    <WithInstallationAlert>
      <TestElem />
    </WithInstallationAlert>,
  );
};

afterEach(() => jest.setSystemTime(jest.getRealSystemTime()));

it('is closed by default', () => {
  render(<WithInstallationAlert />);
  expect(screen.queryByRole('alert')).toBeNull();
});

it('renders children', () => {
  render(
    <WithInstallationAlert>
      <main>hello</main>
    </WithInstallationAlert>,
  );
  expect(screen.getByRole('main').textContent).toBe('hello');
});

describe('request interactions', () => {
  it('does not open after a fast request', async () => {
    renderWithInstallationAlert();

    await waitFor(() => expect(mockAxios.queue()).toHaveLength(1));
    jest.setSystemTime(Date.now() + 100);
    act(() => mockAxios.mockResponse());

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('opens due to a single slow request', async () => {
    renderWithInstallationAlert();

    await waitFor(() => expect(mockAxios.queue()).toHaveLength(1));
    jest.setSystemTime(Date.now() + 100000);
    act(() => mockAxios.mockResponse());

    expect(screen.getByRole('alert').textContent).toContain('Install_Apertium-Default');
  });

  it('opens after a series of slow requests', async () => {
    renderWithInstallationAlert(6);

    await waitFor(() => expect(mockAxios.queue()).toHaveLength(6));

    jest.setSystemTime(Date.now() + 3100);
    act(() => void Array.from({ length: 5 }, () => mockAxios.mockResponse()));

    expect(screen.queryByRole('alert')).toBeNull();

    act(() => mockAxios.mockResponse());

    expect(screen.getByRole('alert')).toBeDefined();
  });
});

describe('open behavior', () => {
  const openAlert = async () => {
    renderWithInstallationAlert();

    await waitFor(() => expect(mockAxios.queue()).toHaveLength(1));
    act(() => {
      jest.setSystemTime(Date.now() + 100000);
      mockAxios.mockResponse();
    });
  };

  it('closes after button click', async () => {
    await openAlert();

    userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('closes after timeout', async () => {
    await openAlert();

    act(() => void jest.advanceTimersByTime(110000));

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('stays open on hover', async () => {
    await openAlert();

    userEvent.hover(screen.getByRole('alert'));
    jest.runAllTimers();

    expect(screen.getByRole('alert')).toBeDefined();

    userEvent.unhover(screen.getByRole('alert'));

    act(() => void jest.advanceTimersByTime(110000));

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
